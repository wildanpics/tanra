import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  updateDoc,

} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Room, Player, RoomSettings, GameState } from "@/types";
import { generateRoomCode } from "@/lib/utils";

const DEFAULT_SETTINGS: RoomSettings = {
  maxPlayers: 8,
  impostorCount: 1,
  clueTime: 60,
  discussionTime: 120,
  votingTime: 60,
  difficulty: "easy",
  category: "Semua Kategori",
  mrWhiteCount: 0,
  hiddenDeath: false,
  micMode: "auto",
  impostorSabotage: false,
};

export async function createRoom(host: Player): Promise<string> {
  let code = generateRoomCode();
  let exists = true;

  // Ensure unique code
  while (exists) {
    const q = query(collection(db, "rooms"), where("code", "==", code));
    const snap = await getDocs(q);
    if (snap.empty) exists = false;
    else code = generateRoomCode();
  }

  const roomId = doc(collection(db, "rooms")).id;
  const initialGameState: GameState = {
    phase: "waiting",
    round: 0,
    eliminatedPlayers: [],
  };

  const room: Omit<Room, "id"> = {
    code,
    hostId: host.id,
    createdAt: Date.now(),
    status: "waiting",
    players: {
      [host.id]: { ...host, isHost: true, isReady: false },
    },
    gameState: initialGameState,
    settings: DEFAULT_SETTINGS,
  };

  await setDoc(doc(db, "rooms", roomId), room);
  return roomId;
}

export async function updateRoomSettings(roomId: string, settings: Partial<RoomSettings>) {
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(settings)) {
    updates[`settings.${key}`] = value;
  }
  await updateDoc(doc(db, "rooms", roomId), updates);
}

export async function joinRoom(
  code: string,
  player: Player
): Promise<string | null> {
  const q = query(
    collection(db, "rooms"),
    where("code", "==", code.toUpperCase()),
    where("status", "==", "waiting")
  );
  const snap = await getDocs(q);

  if (snap.empty) return null;

  const roomDoc = snap.docs[0];
  const room = roomDoc.data() as Room;

  const isGhost = typeof window !== "undefined" && localStorage.getItem("TANRA_GHOST_MODE") === "true";

  const playerCount = Object.keys(room.players || {}).length;
  if (!isGhost && playerCount >= room.settings.maxPlayers) {
    throw new Error("Room penuh");
  }

  await updateDoc(doc(db, "rooms", roomDoc.id), {
    [`players.${player.id}`]: { ...player, isReady: isGhost ? true : false, isGhost },
  });

  return roomDoc.id;
}

export async function getRoomById(roomId: string): Promise<Room | null> {
  const snap = await getDoc(doc(db, "rooms", roomId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Room;
}

export async function startGame(
  roomId: string,
  players: Player[],
  wordPair: { civilian: string; impostor: string },
  impostorIds: string[],
  mrWhiteIds: string[] = []
): Promise<void> {
  const playerUpdates: Record<string, unknown> = {};

  players.forEach((p) => {
    const isImpostor = impostorIds.includes(p.id);
    const isMrWhite = mrWhiteIds.includes(p.id);
    
    let role = "civilian";
    let word = wordPair.civilian;
    
    if (isImpostor) {
      role = "impostor";
      word = wordPair.impostor;
    } else if (isMrWhite) {
      role = "mr_white";
      word = "KOSONG";
    }

    playerUpdates[`players.${p.id}.role`] = role;
    playerUpdates[`players.${p.id}.word`] = word;
    playerUpdates[`players.${p.id}.isAlive`] = true;
    playerUpdates[`players.${p.id}.votedFor`] = null;
  });

  const shuffledOrder = [...players]
    .sort(() => Math.random() - 0.5)
    .map((p) => p.id);

  await updateDoc(doc(db, "rooms", roomId), {
    status: "playing",
    ...playerUpdates,
    "gameState.phase": "role-reveal",
    "gameState.round": 1,
    "gameState.impostorIds": impostorIds,
    "gameState.mrWhiteIds": mrWhiteIds,
    "gameState.clueOrder": shuffledOrder,
    "gameState.currentClueIndex": 0,
    "gameState.timerEnd": Date.now() + 8000,
    "gameState.timerDuration": 8,
    "gameState.revealedWord": null,
    "gameState.winner": null,
  });
}

export async function advancePhase(
  roomId: string,
  newPhase: string,
  duration: number,
  extra?: Record<string, unknown>
) {
  await updateDoc(doc(db, "rooms", roomId), {
    "gameState.phase": newPhase,
    "gameState.timerEnd": Date.now() + duration * 1000,
    "gameState.timerDuration": duration,
    ...extra,
  });
}

export async function eliminatePlayer(roomId: string, playerId: string) {
  await updateDoc(doc(db, "rooms", roomId), {
    [`players.${playerId}.isAlive`]: false,
  });
}

export async function endGame(
  roomId: string,
  winner: "civilian" | "impostor" | "mr_white",
  revealedWord: { civilian: string; impostor: string }
) {
  await updateDoc(doc(db, "rooms", roomId), {
    status: "finished",
    "gameState.phase": "result",
    "gameState.winner": winner,
    "gameState.revealedWord": revealedWord,
  });
}

export async function removePlayer(roomId: string, playerId: string, extraUpdates?: Record<string, unknown>) {
  const { deleteField } = await import("firebase/firestore");
  await updateDoc(doc(db, "rooms", roomId), {
    [`players.${playerId}`]: deleteField(),
    ...extraUpdates,
  });
}

export async function resetRoom(roomId: string) {
  await updateDoc(doc(db, "rooms", roomId), {
    status: "waiting",
    "gameState.phase": "waiting",
    "gameState.round": 0,
    "gameState.winner": null,
    "gameState.revealedWord": null,
    "gameState.impostorIds": [],
    "gameState.mrWhiteIds": [],
  });
}
