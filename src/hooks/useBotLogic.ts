"use client";

import { useEffect, useRef } from "react";
import { Room, Player } from "@/types";
import { sendMessage, castVote } from "@/features/room/useRoom";

const categoryClues: Record<string, string[]> = {
  Makanan: ["Enak rasanya", "Bisa dimakan", "Mengenyangkan", "Banyak dijual di luar", "Sering ada di meja makan", "Punya rasa khas"],
  Minuman: ["Bisa diminum", "Menyegarkan", "Biasanya cair", "Bisa menghilangkan haus", "Ada yang panas ada yang dingin", "Ditaruh di gelas"],
  Tempat: ["Sebuah lokasi", "Bisa dikunjungi", "Tempatnya bisa luas atau sempit", "Ada alamatnya", "Bisa di dalam atau di luar"],
  Makhluk: ["Bernyawa", "Bisa bergerak", "Punya ciri khas tertentu", "Bisa berkembang biak", "Ada yang buas ada yang jinak"],
  Transportasi: ["Bisa dikendarai", "Punya roda atau mesin", "Untuk bepergian", "Punya kapasitas penumpang", "Bisa berjalan cepat"],
  Teknologi: ["Pakai listrik atau baterai", "Alat canggih", "Membantu manusia", "Buatan pabrik", "Punya layar atau tombol"],
  Material: ["Terbuat dari bahan tertentu", "Benda mati", "Sering disentuh", "Punya tekstur khusus", "Bisa keras atau lembut"],
  Pakaian: ["Bisa dipakai", "Bahan kain", "Punya warna dan ukuran", "Untuk menutupi badan", "Bisa dicuci"],
  Pekerjaan: ["Sebuah profesi", "Menghasilkan uang", "Butuh keahlian", "Dilakukan manusia", "Sering dihormati"],
  Hobi: ["Dilakukan saat senggang", "Menyenangkan", "Butuh waktu luang", "Bisa bikin lupa waktu", "Ada komunitasnya"],
  Alam: ["Bagian dari bumi", "Natural", "Bisa sangat besar", "Tidak dibuat manusia", "Sangat indah"],
  Kustom: ["Ini hal yang menarik", "Kalian pasti tahu ini", "Sering dibahas", "Punya ciri khas unik", "Tergantung siapa yang lihat"]
};

const genericClues = [
  "Benda ini cukup umum",
  "Biasanya bisa ditemukan di sekitar kita",
  "Saya rasa semua orang tahu ini",
  "Punya kegunaan khusus",
  "Ukurannya bervariasi",
  "Bukan sesuatu yang aneh",
  "Cukup populer di Indonesia"
];

const botChatTemplates = [
  "Hmm, petunjuknya agak mencurigakan ya.",
  "Saya merasa ada yang bohong nih.",
  "Sumpah bukan saya penipunya!",
  "Ayo coba dipikir lagi.",
  "Jangan-jangan Jester lagi mancing?",
  "Saya yakin 100% dengan kata saya.",
  "Kok pada diam sih?",
  "Feeling saya sih bukan dia."
];

export function useBotLogic(room: Room | null, isHost: boolean, onNextTurn: () => void) {
  const lastPhaseRef = useRef<string>("");
  const lastClueIndexRef = useRef<number>(-1);
  const discussionChatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!room || !isHost) return;

    const { gameState, players, settings } = room;
    if (!gameState) return;

    const phase = gameState.phase;
    const allPlayers = Object.values(players) as Player[];
    const alivePlayers = allPlayers.filter(p => p.isAlive);
    const aliveBots = alivePlayers.filter(p => p.isBot);

    // Don't do anything if no bots
    if (aliveBots.length === 0) return;

    // --- CLUE PHASE ---
    if (phase === "clue") {
      const currentId = gameState.clueOrder?.[gameState.currentClueIndex || 0];
      const currentPlayer = players[currentId || ""];
      
      // If the current player is a bot and turn just changed
      if (currentPlayer?.isBot && lastClueIndexRef.current !== gameState.currentClueIndex) {
        lastClueIndexRef.current = gameState.currentClueIndex || 0;
        
        // Simulate thinking time
        setTimeout(async () => {
          // Generate Clue
          let clue = "";
          const cat = settings.category || "Semua Kategori";
          const catClues = categoryClues[cat] || genericClues;
          
          if (currentPlayer.role === "civilian") {
            // Civilian bot has 30% chance to say length/letter
            if (Math.random() < 0.3 && currentPlayer.word) {
              const types = [
                `Kata ini berawalan huruf ${currentPlayer.word.charAt(0).toUpperCase()}`,
                `Kata ini terdiri dari ${currentPlayer.word.length} huruf`
              ];
              clue = types[Math.floor(Math.random() * types.length)];
            } else {
              clue = catClues[Math.floor(Math.random() * catClues.length)];
            }
          } else {
            // Impostor, Mr White, Jester bots just use random category generic clues to blend in
            clue = catClues[Math.floor(Math.random() * catClues.length)];
          }

          // Send message
          await sendMessage(room.id, {
            playerId: currentPlayer.id,
            username: currentPlayer.username,
            avatar: currentPlayer.avatar,
            text: clue,
            timestamp: Date.now(),
            type: "chat",
          });

          // Wait 2 seconds then advance turn
          setTimeout(() => {
            onNextTurn();
          }, 2000);

        }, 3000 + Math.random() * 2000); // 3-5 seconds thinking
      }
    } else {
      lastClueIndexRef.current = -1;
    }

    // --- DISCUSSION PHASE ---
    if (phase === "discussion" && lastPhaseRef.current !== "discussion") {
      lastPhaseRef.current = "discussion";
      
      // Clear old interval if exists
      if (discussionChatIntervalRef.current) clearInterval(discussionChatIntervalRef.current);
      
      // Every 10 seconds, random bot says something
      discussionChatIntervalRef.current = setInterval(() => {
        if (Math.random() > 0.5) return; // 50% chance to speak
        const speakingBot = aliveBots[Math.floor(Math.random() * aliveBots.length)];
        const text = botChatTemplates[Math.floor(Math.random() * botChatTemplates.length)];
        
        sendMessage(room.id, {
          playerId: speakingBot.id,
          username: speakingBot.username,
          avatar: speakingBot.avatar,
          text: text,
          timestamp: Date.now(),
          type: "chat",
        });
      }, 10000);
    }

    // Clear interval when leaving discussion
    if (phase !== "discussion") {
      if (discussionChatIntervalRef.current) {
        clearInterval(discussionChatIntervalRef.current);
        discussionChatIntervalRef.current = null;
      }
    }

    // --- VOTING PHASE ---
    if (phase === "voting" && lastPhaseRef.current !== "voting") {
      lastPhaseRef.current = "voting";
      
      // Make bots vote gradually
      aliveBots.forEach((bot, index) => {
        setTimeout(async () => {
          // Re-fetch alive players
          const latestAlive = Object.values(room.players).filter((p: any) => p.isAlive);
          // Pick a random alive target (prefer someone else)
          let target = latestAlive[Math.floor(Math.random() * latestAlive.length)];
          if (target.id === bot.id && latestAlive.length > 1) {
             const others = latestAlive.filter(p => p.id !== bot.id);
             target = others[Math.floor(Math.random() * others.length)];
          }
          
          await castVote(room.id, bot.id, target.id);
        }, 3000 + (index * 2000) + Math.random() * 2000); // Staggered votes
      });
    }

    if (phase !== "discussion" && phase !== "voting") {
      lastPhaseRef.current = phase;
    }

  }, [room, isHost, onNextTurn]);
}
