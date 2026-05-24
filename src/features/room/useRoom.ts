"use client";

import { useEffect, useState, useRef } from "react";
import {
  doc,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  setDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Room, Player, Message, GameState } from "@/types";

export function useRoom(roomId: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, "rooms", roomId),
      (snap) => {
        if (snap.exists()) {
          setRoom({ id: snap.id, ...snap.data() } as Room);
        } else {
          setError("Room tidak ditemukan");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Room listener error:", err);
        setError("Gagal terhubung ke room");
        setLoading(false);
      }
    );

    return unsub;
  }, [roomId]);

  return { room, loading, error };
}

export function useMessages(roomId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!roomId) return;

    const q = query(
      collection(db, "rooms", roomId, "messages"),
      orderBy("timestamp", "asc"),
      limit(100)
    );

    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Message)
      );
      setMessages(msgs);
    });

    return unsub;
  }, [roomId]);

  return messages;
}

export async function sendMessage(
  roomId: string,
  message: Omit<Message, "id">
) {
  await addDoc(collection(db, "rooms", roomId, "messages"), message);
}

export async function updatePlayerReady(
  roomId: string,
  playerId: string,
  isReady: boolean
) {
  await updateDoc(doc(db, "rooms", roomId), {
    [`players.${playerId}.isReady`]: isReady,
  });
}

export async function castVote(
  roomId: string,
  voterId: string,
  targetId: string
) {
  await updateDoc(doc(db, "rooms", roomId), {
    [`players.${voterId}.votedFor`]: targetId,
  });
}

export async function updateGameState(
  roomId: string,
  gameState: Partial<GameState>
) {
  await updateDoc(doc(db, "rooms", roomId), {
    ...Object.fromEntries(
      Object.entries(gameState).map(([k, v]) => [`gameState.${k}`, v])
    ),
  });
}

export async function removePlayer(roomId: string, playerId: string) {
  await updateDoc(doc(db, "rooms", roomId), {
    [`players.${playerId}`]: null,
  });
}
