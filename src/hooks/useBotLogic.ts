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
  const roomRef = useRef<Room | null>(room);
  
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

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
          
          if (currentPlayer.role === "civilian" && currentPlayer.word) {
            const word = currentPlayer.word.trim();
            const wordsCount = word.split(" ").length;
            
            const dynamicTypes = [
               `Kata ini terdiri dari ${word.replace(/\s/g, '').length} huruf.`,
               `Huruf depan kata ini adalah '${word.charAt(0).toUpperCase()}'.`,
               `Huruf terakhirnya adalah '${word.charAt(word.length - 1).toUpperCase()}'.`,
            ];
            
            if (wordsCount > 1) {
               dynamicTypes.push(`Tebakan kali ini terdiri dari ${wordsCount} kata loh.`);
            }
            
            // 40% chance to use a smart dynamic clue (Word Analyzer)
            if (Math.random() < 0.4) {
               clue = dynamicTypes[Math.floor(Math.random() * dynamicTypes.length)];
            } else {
               clue = catClues[Math.floor(Math.random() * catClues.length)];
            }
          } else {
            // Impostor, Mr White, Jester bots
            // Impostor Blending: If not the first to speak, pretend to agree with others
            if (gameState.currentClueIndex && gameState.currentClueIndex > 0 && Math.random() < 0.6) {
               const impostorBlends = [
                 "Aku setuju sama yang tadi sih, barang ini emang umum.",
                 "Sama kayak yang sebelumnya, menurutku ini sering kita lihat.",
                 "Iya bener, ukurannya emang bervariasi tergantung jenisnya.",
                 "Aku tadinya mau kasih clue yang sama, tapi ya udahlah: ini gampang ditemuin.",
                 "Clue-ku mirip sama yang lain, intinya ini ada di sekitar kita."
               ];
               clue = impostorBlends[Math.floor(Math.random() * impostorBlends.length)];
            } else {
               clue = catClues[Math.floor(Math.random() * catClues.length)];
            }
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
          // Use roomRef to get the LATEST state instead of stale closure
          const currentRoom = roomRef.current;
          if (!currentRoom || currentRoom.gameState?.phase !== "voting") return;

          // Re-fetch alive players
          const latestAlive = Object.values(currentRoom.players).filter((p: any) => p.isAlive);
          
          // Bandwagon Logic: Check who currently has the most votes
          const voteCounts: Record<string, number> = {};
          Object.values(currentRoom.players).forEach(p => {
             if (p.votedFor) {
               voteCounts[p.votedFor] = (voteCounts[p.votedFor] || 0) + 1;
             }
          });
          
          const sortedCandidates = Object.entries(voteCounts).sort((a,b) => b[1] - a[1]);
          let target: Player | undefined;
          
          // 70% chance to follow the bandwagon if someone has votes (and it's not the bot itself)
          if (sortedCandidates.length > 0 && Math.random() < 0.7) {
             const topCandidateId = sortedCandidates[0][0];
             if (bot.role !== "jester" && topCandidateId !== bot.id) {
                target = latestAlive.find(p => p.id === topCandidateId);
             }
          }
          
          // Fallback to random if no bandwagon or if they choose to vote independently
          if (!target) {
            target = latestAlive[Math.floor(Math.random() * latestAlive.length)];
            if (target.id === bot.id && latestAlive.length > 1) {
               const others = latestAlive.filter(p => p.id !== bot.id);
               target = others[Math.floor(Math.random() * others.length)];
            }
          }
          
          if (target) {
            await castVote(currentRoom.id, bot.id, target.id);
          }
        }, 4000 + (index * 3000) + Math.random() * 2000); // Staggered votes with longer delay to allow humans to vote first
      });
    }

    if (phase !== "discussion" && phase !== "voting") {
      lastPhaseRef.current = phase;
    }

  }, [room, isHost, onNextTurn]);
}
