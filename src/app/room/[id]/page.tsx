"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Crown, LogOut, Play, Users, Check, Settings } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useRoom, updatePlayerReady, sendMessage } from "@/features/room/useRoom";
import { startGame, removePlayer, updateRoomSettings, deleteRoom } from "@/services/roomService";
import { getRandomWordPair } from "@/services/wordService";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { Player } from "@/types";
import { shuffleArray } from "@/lib/utils";

export default function RoomPage() {
  const params = useParams();
  const roomId = params.id as string;
  const router = useRouter();
  const { profile } = useAuth();
  const { ready } = useAuthGuard({ requireAuth: true });
  const { room, loading, error } = useRoom(roomId);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [customCivilianWord, setCustomCivilianWord] = useState("");
  const [customImpostorWord, setCustomImpostorWord] = useState("");

  const allPlayers = Object.values(room?.players || {}) as Player[];
  const players = allPlayers.filter(p => !p.isGhost);
  const myPlayer = allPlayers.find((p) => p.id === profile?.uid);
  const isHost = room?.hostId === profile?.uid;
  const allReady = players.every((p) => p.isReady || p.isHost);
  const canStart = isHost && players.length >= 2 && allReady;

  useEffect(() => {
    if (room?.gameState?.phase && room.gameState.phase !== "waiting") {
      router.push(`/game/${roomId}`);
    }
  }, [room?.gameState?.phase, roomId, router]);

  // Jika tidak ada di daftar pemain (ditendang), kembali ke home
  useEffect(() => {
    if (!loading && room && profile && !myPlayer) {
      router.push("/home");
    }
  }, [loading, room, profile, myPlayer, router]);

  async function copyCode() {
    if (!room?.code) return;
    await navigator.clipboard.writeText(room.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function toggleReady() {
    if (!profile || !myPlayer) return;
    await updatePlayerReady(roomId, profile.uid, !myPlayer.isReady);
  }

  async function cycleSetting(key: keyof import("@/types").RoomSettings, options: any[]) {
    if (!isHost || !room) return;
    const current = room.settings[key];
    const currentIndex = options.indexOf(current);
    const nextValue = options[(currentIndex + 1) % options.length];
    await updateRoomSettings(roomId, { [key]: nextValue });
  }

  async function handleStart() {
    if (!isHost || !canStart || !room) return;
    setStarting(true);
    try {
      let wordPair;
      if (room.settings.category === "Kustom") {
        if (!customCivilianWord.trim() || !customImpostorWord.trim()) {
          alert("Silakan isi Kata Warga dan Kata Penipu untuk mode Kustom!");
          setStarting(false);
          return;
        }
        wordPair = { civilian: customCivilianWord.trim(), impostor: customImpostorWord.trim() };
      } else {
        wordPair = await getRandomWordPair(room.settings.difficulty, room.settings.category);
      }
      const targetImpostors = room.settings.impostorCount;
      const mrWhiteCount = room.settings.mrWhiteCount || 0;
      const jesterCount = room.settings.jesterCount || 0;
      const totalSpecial = targetImpostors + mrWhiteCount + jesterCount;

      if (totalSpecial >= players.length) {
        alert("Jumlah pemain spesial (Penipu + Mr White + Jester) tidak boleh melebihi atau sama dengan total pemain.");
        setStarting(false);
        return;
      }
      
      const shuffled = shuffleArray(players);
      let impostorIds = shuffled.slice(0, targetImpostors).map((p) => p.id);
      let mrWhiteIds = shuffled.slice(targetImpostors, targetImpostors + mrWhiteCount).map((p) => p.id);
      let jesterIds = shuffled.slice(targetImpostors + mrWhiteCount, totalSpecial).map((p) => p.id);

      // DEV CHEAT: Force Role
      const forceRole = typeof window !== "undefined" ? localStorage.getItem("TANRA_FORCE_ROLE") : null;
      if (forceRole === "impostor" && profile?.uid) {
        if (!impostorIds.includes(profile.uid)) {
          impostorIds[0] = profile.uid;
        }
        mrWhiteIds = mrWhiteIds.filter(id => id !== profile.uid);
      } else if (forceRole === "civilian" && profile?.uid) {
        impostorIds = impostorIds.filter(id => id !== profile.uid);
        mrWhiteIds = mrWhiteIds.filter(id => id !== profile.uid);
        if (impostorIds.length < targetImpostors) {
          const candidates = players.filter(p => p.id !== profile.uid && !impostorIds.includes(p.id));
          if (candidates.length > 0) impostorIds.push(candidates[0].id);
        }
      }
      if (typeof window !== "undefined") localStorage.removeItem("TANRA_FORCE_ROLE");

      await startGame(roomId, players, wordPair, impostorIds, mrWhiteIds, jesterIds);
      await sendMessage(roomId, {
        playerId: "system",
        username: "System",
        avatar: "",
        text: "Permainan dimulai!",
        timestamp: Date.now(),
        type: "system",
      });
    } catch (err) {
      console.error("Start game error:", err);
    } finally {
      setStarting(false);
    }
  }

  async function addBot() {
    if (!isHost || !room) return;
    const botId = `bot_${Date.now()}`;
    const botNames = ["Jason", "Nova", "Alex", "Sam", "Charlie", "Max", "Riley", "Taylor", "Jordan", "Casey", "Budi", "Siti", "Joko", "Ayu", "Reza"];
    
    // Filter nama bot yang belum ada di dalam room
    const existingNames = players.map(p => p.username);
    const availableNames = botNames.filter(name => !existingNames.includes(`Bot_${name}`));
    
    const randomName = availableNames.length > 0 
      ? availableNames[Math.floor(Math.random() * availableNames.length)]
      : `X${Math.floor(Math.random() * 1000)}`;
      
    const botPlayer: Player = {
      id: botId,
      username: `Bot_${randomName}`,
      avatar: `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${randomName}`,
      isAlive: true,
      isReady: true,
      isBot: true,
    };
    const { updateDoc, doc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");
    await updateDoc(doc(db, "rooms", roomId), {
      [`players.${botId}`]: botPlayer
    });
  }

  async function leaveRoom() {
    if (!profile) return;
    try {
      const remainingPlayers = players.filter(p => p.id !== profile.uid);
      
      if (remainingPlayers.length === 0) {
        await deleteRoom(roomId);
      } else {
        const updates: Record<string, any> = {};
        if (isHost) {
          // Pindahkan takhta Host ke pemain pertama yang masih ada
          const newHost = remainingPlayers[0];
          updates.hostId = newHost.id;
          updates[`players.${newHost.id}.isHost`] = true;
        }
        await removePlayer(roomId, profile.uid, updates);
      }
    } catch (err) {
      console.error("Gagal keluar:", err);
    }
    router.push("/home");
  }

  if (!ready || loading) {
    return (
      <div className="min-h-dvh bg-[#0E1116] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-[#C8A96B] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-dvh bg-[#0E1116] flex flex-col items-center justify-center gap-4">
        <p className="text-[#A63D40]">{error}</p>
        <Button onClick={() => router.push("/home")} variant="secondary">Kembali</Button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh w-full flex justify-center bg-[#0E1116]">
      <div className="w-full max-w-md relative overflow-hidden flex flex-col sm:border-x sm:border-[#262B33]/30 shadow-2xl bg-[#0E1116]">
        <div className="absolute inset-0 batik-overlay opacity-30 pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-[#C8A96B]/4 to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-md h-full min-h-dvh flex flex-col px-4 pt-6 pb-32 safe-top sm:border-x sm:border-[#262B33]/30 sm:bg-[#171B22]/10 sm:backdrop-blur-sm sm:shadow-2xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl gradient-text">Ruang Tunggu</h1>
            <p className="text-[#8A8F98] text-sm mt-0.5">{players.length} dari {room?.settings.maxPlayers} pemain</p>
          </div>
          <button onClick={leaveRoom} className="w-10 h-10 flex items-center justify-center rounded-xl border border-[#262B33] text-[#A63D40] hover:bg-[#A63D40]/10 transition-colors">
            <LogOut size={18} className="mr-0.5" />
          </button>
        </motion.div>

        {/* Room Code */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard glow className="mb-4">
            <p className="text-[#8A8F98] text-xs mb-2 tracking-wider uppercase font-medium">Kode Ruangan</p>
            <div className="flex items-center justify-between">
              <span className="font-display font-black text-4xl leading-none gradient-text tracking-[0.2em] mt-1">
                {room?.code}
              </span>
              <motion.button
                onClick={copyCode}
                whileTap={{ scale: 0.9 }}
                className="flex items-center gap-2 px-4 py-2 bg-[#0E1116] border border-[#262B33] rounded-xl text-sm text-[#8A8F98] hover:text-[#C8A96B] hover:border-[#C8A96B]/30 transition-colors"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="text-green-400 flex items-center gap-1">
                      <Check size={14} /> Disalin
                    </motion.span>
                  ) : (
                    <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="flex items-center gap-1">
                      <Copy size={14} /> Salin
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
            <p className="text-[#8A8F98] text-xs mt-2">Bagikan kode ini kepada temanmu</p>
          </GlassCard>
        </motion.div>

        {/* Players List */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[#C8A96B]" />
                <p className="font-semibold text-sm">Pemain ({players.length})</p>
              </div>
              {isHost && (
                <button 
                  onClick={addBot}
                  className="px-3 py-1 bg-[#171B22] border border-[#262B33] rounded-lg text-xs font-bold text-[#C8A96B] hover:bg-[#C8A96B]/10 transition-colors"
                >
                  + Tambah Bot
                </button>
              )}
            </div>

            <div className="space-y-2">
              <AnimatePresence>
                {players.map((player, i) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 bg-[#0E1116] rounded-xl border border-[#262B33]"
                  >
                    <div 
                      className="relative cursor-pointer"
                      onClick={() => {
                        if (player.id === profile?.uid) {
                          window.dispatchEvent(new CustomEvent("tanra-toggle-dev-btn"));
                        }
                      }}
                    >
                      <img
                        src={player.avatar}
                        alt={player.username}
                        className="w-10 h-10 rounded-full border border-[#262B33]"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${player.username}`; }}
                      />
                      {player.isHost && (
                        <div className="absolute -top-1.5 -right-1.5 bg-[#171B22] rounded-full p-1 border border-[#C8A96B] shadow-md">
                          <Crown size={12} className="text-[#C8A96B]" strokeWidth={2.5} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate flex items-center">
                        {player.username}
                        {player.id === profile?.uid && (
                          <span className="text-[#C8A96B] font-bold text-[10px] ml-2 px-1.5 py-0.5 bg-[#C8A96B]/10 rounded border border-[#C8A96B]/20">KAMU</span>
                        )}
                      </p>
                      <p className="text-xs text-[#8A8F98]">
                        {player.isHost ? "Host" : player.isReady ? "Siap" : "Menunggu..."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        player.isHost ? "bg-[#C8A96B]" : player.isReady ? "bg-green-500" : "bg-[#262B33]"
                      }`} />
                      
                      {isHost && player.id !== profile?.uid && (
                        <button
                          onClick={async () => {
                            if (window.confirm(`Yakin ingin menendang ${player.username}?`)) {
                              await removePlayer(roomId, player.id);
                            }
                          }}
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-[#A63D40]/10 text-[#A63D40] hover:bg-[#A63D40] hover:text-white transition-colors"
                          title="Tendang Pemain"
                        >
                          <LogOut size={12} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Empty slots */}
              {Array.from({ length: Math.max(0, (room?.settings.maxPlayers || 8) - players.length) }).slice(0, 3).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-[#0E1116]/50 rounded-xl border border-[#262B33]/50">
                  <div className="w-10 h-10 rounded-full border border-dashed border-[#262B33] flex items-center justify-center flex-shrink-0 aspect-square">
                    <span className="text-[#262B33] text-lg font-light">+</span>
                  </div>
                  <p className="text-[#8A8F98]/50 text-sm">Menunggu pemain...</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Settings Overview */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <GlassCard className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings size={14} className="text-[#C8A96B]" />
              <p className="text-xs font-medium text-[#8A8F98] uppercase tracking-wider">Pengaturan</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => cycleSetting("impostorCount", [1, 2, 3])}
                disabled={!isHost}
                className={`text-center p-2 bg-[#0E1116] rounded-xl border border-transparent ${isHost ? "hover:border-[#C8A96B]/50 cursor-pointer" : ""}`}
              >
                <p className="text-[#C8A96B] font-bold text-sm">{room?.settings.impostorCount}</p>
                <p className="text-[#8A8F98] text-[10px] uppercase">Penipu</p>
              </button>
              
              <button 
                onClick={() => cycleSetting("mrWhiteCount", [0, 1])}
                disabled={!isHost}
                className={`text-center p-2 bg-[#0E1116] rounded-xl border border-transparent ${isHost ? "hover:border-[#C8A96B]/50 cursor-pointer" : ""}`}
              >
                <p className="text-[#C8A96B] font-bold text-sm">{(room?.settings.mrWhiteCount || 0) > 0 ? "Ya" : "Tidak"}</p>
                <p className="text-[#8A8F98] text-[10px] uppercase">Si Kosong</p>
              </button>

              <button 
                onClick={() => cycleSetting("jesterCount", [0, 1])}
                disabled={!isHost}
                className={`text-center p-2 bg-[#0E1116] rounded-xl border border-transparent ${isHost ? "hover:border-[#C8A96B]/50 cursor-pointer" : ""}`}
              >
                <p className="text-[#C8A96B] font-bold text-sm">{(room?.settings.jesterCount || 0) > 0 ? "Ya" : "Tidak"}</p>
                <p className="text-[#8A8F98] text-[10px] uppercase">Si Badut (Jester)</p>
              </button>

              <button 
                onClick={() => cycleSetting("category", ["Semua Kategori", "Makanan", "Hewan", "Tempat", "Profesi", "Kustom"])}
                disabled={!isHost}
                className={`text-center p-2 bg-[#0E1116] rounded-xl border border-transparent ${isHost ? "hover:border-[#C8A96B]/50 cursor-pointer" : ""}`}
              >
                <p className="text-[#C8A96B] font-bold text-xs truncate px-1">{room?.settings.category || "Semua"}</p>
                <p className="text-[#8A8F98] text-[10px] uppercase">Kategori</p>
              </button>

              <button 
                onClick={() => cycleSetting("clueTime", [30, 60, 90])}
                disabled={!isHost}
                className={`text-center p-2 bg-[#0E1116] rounded-xl border border-transparent ${isHost ? "hover:border-[#C8A96B]/50 cursor-pointer" : ""}`}
              >
                <p className="text-[#C8A96B] font-bold text-sm">{room?.settings.clueTime}d</p>
                <p className="text-[#8A8F98] text-[10px] uppercase">Petunjuk</p>
              </button>

              <button 
                onClick={() => cycleSetting("discussionTime", [60, 120, 180])}
                disabled={!isHost}
                className={`text-center p-2 bg-[#0E1116] rounded-xl border border-transparent ${isHost ? "hover:border-[#C8A96B]/50 cursor-pointer" : ""}`}
              >
                <p className="text-[#C8A96B] font-bold text-sm">{room?.settings.discussionTime}d</p>
                <p className="text-[#8A8F98] text-[10px] uppercase">Diskusi</p>
              </button>

              <button 
                onClick={() => cycleSetting("hiddenDeath", [false, true])}
                disabled={!isHost}
                className={`text-center p-2 bg-[#0E1116] rounded-xl border border-transparent ${isHost ? "hover:border-[#C8A96B]/50 cursor-pointer" : ""}`}
              >
                <p className="text-[#C8A96B] font-bold text-xs">{room?.settings.hiddenDeath ? "Rahasia" : "Terbuka"}</p>
                <p className="text-[#8A8F98] text-[10px] uppercase">Identitas Mati</p>
              </button>

              <button 
                onClick={() => cycleSetting("impostorSabotage", [false, true])}
                disabled={!isHost}
                className={`text-center p-2 bg-[#0E1116] rounded-xl border border-transparent ${isHost ? "hover:border-[#C8A96B]/50 cursor-pointer" : ""}`}
              >
                <p className="text-[#C8A96B] font-bold text-xs">{room?.settings.impostorSabotage ? "Aktif" : "Mati"}</p>
                <p className="text-[#8A8F98] text-[10px] uppercase">Sabotase</p>
              </button>
            </div>

            {/* Custom Words Input (Only when Kustom is selected) */}
            {room?.settings.category === "Kustom" && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 p-4 border border-[#C8A96B]/30 rounded-xl bg-[#C8A96B]/5 space-y-3"
              >
                <p className="text-[#C8A96B] text-xs font-bold uppercase tracking-wider">Kata Kustom (Hanya Host yang Tahu)</p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={customCivilianWord}
                      onChange={e => setCustomCivilianWord(e.target.value)}
                      placeholder="Kata Warga"
                      disabled={!isHost}
                      className="w-full bg-[#0E1116] border border-[#262B33] rounded-lg px-3 py-2 text-sm text-[#F5F5F5] focus:border-[#C8A96B] outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={customImpostorWord}
                      onChange={e => setCustomImpostorWord(e.target.value)}
                      placeholder="Kata Penipu"
                      disabled={!isHost}
                      className="w-full bg-[#0E1116] border border-[#A63D40]/50 rounded-lg px-3 py-2 text-sm text-[#F5F5F5] focus:border-[#A63D40] outline-none"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </GlassCard>
        </motion.div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-4 pb-6 bg-gradient-to-t from-[#0E1116] via-[#0E1116]/90 to-transparent z-20">
        <div className="space-y-3">
          {isHost ? (
            <Button
              onClick={handleStart}
              disabled={!canStart}
              loading={starting}
              variant={canStart ? "primary" : "secondary"}
              fullWidth
              size="xl"
              icon={<Play size={20} />}
            >
              {players.length < 2 ? "Butuh 2 Pemain" : !allReady ? "Menunggu Semua Siap" : "Mulai Permainan"}
            </Button>
          ) : (
            <Button
              onClick={toggleReady}
              variant={myPlayer?.isReady ? "secondary" : "primary"}
              fullWidth
              size="xl"
              icon={myPlayer?.isReady ? <Check size={20} /> : <Play size={20} />}
            >
              {myPlayer?.isReady ? "Batalkan Kesiapan" : "Saya Siap!"}
            </Button>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
