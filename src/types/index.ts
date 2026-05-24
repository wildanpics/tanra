export type Role = "civilian" | "impostor" | "mr_white";

export type GamePhase =
  | "waiting"
  | "role-reveal"
  | "clue"
  | "discussion"
  | "voting"
  | "result";

export type Difficulty = "easy" | "medium" | "hard";

export interface Player {
  id: string;
  username: string;
  avatar: string;
  role?: Role;
  word?: string;
  isAlive: boolean;
  isReady: boolean;
  isSpeaking?: boolean;
  isMuted?: boolean;
  votedFor?: string;
  isHost?: boolean;
  joinedAt?: number;
  isGhost?: boolean;
}

export interface WordPair {
  id: string;
  civilian: string;
  impostor: string;
  category: string;
  difficulty: Difficulty;
}

export interface Message {
  id: string;
  playerId: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: number;
  type?: "chat" | "system" | "emote";
}

export interface Vote {
  voterId: string;
  targetId: string;
  timestamp: number;
}

export interface GameState {
  phase: GamePhase;
  round: number;
  wordPairId?: string;
  timerEnd?: number;
  timerDuration?: number;
  impostorIds?: string[];
  mrWhiteIds?: string[];
  eliminatedPlayers?: string[];
  winner?: "civilian" | "impostor" | "mr_white" | null;
  revealedWord?: { civilian: string; impostor: string };
  clueOrder?: string[];
  currentClueIndex?: number;
  sabotagedPlayerId?: string | null;
  sabotageUsed?: boolean;
  settings?: RoomSettings;
}

export interface RoomSettings {
  maxPlayers: number;
  impostorCount: number;
  clueTime: number;
  discussionTime: number;
  votingTime: number;
  difficulty: Difficulty;
  category: string;
  mrWhiteCount: number;
  hiddenDeath: boolean;
  micMode: "auto" | "open";
  impostorSabotage: boolean;
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  createdAt: number;
  status: "waiting" | "playing" | "finished";
  players: Record<string, Player>;
  gameState: GameState;
  settings: RoomSettings;
}

export interface UserProfile {
  uid: string;
  username: string;
  avatar: string;
  email: string;
  createdAt: number;
  gamesPlayed?: number;
  wins?: number;
}
