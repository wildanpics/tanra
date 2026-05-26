"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Plus, Hash, Users, LogOut, ChevronRight, X, Zap } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { createRoom, joinRoom } from "@/services/roomService";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Player } from "@/types";
import { sendMessage } from "@/features/room/useRoom";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

export default function HomePage() {
  const { user, profile, logout } = useAuth();
  const { ready, loading } = useAuthGuard({ requireAuth: true });
  const router = useRouter();

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  if (loading || !ready) {
    return (
      <div className="min-h-dvh bg-[#0E1116] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-[#C8A96B] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  function buildPlayer(): Player {
    return {
      id: profile!.uid,
      username: profile!.username,
      avatar: profile!.avatar,
      isAlive: true,
      isReady: false,
    };
  }

  async function handleCreateRoom() {
    if (!profile) return;
    setCreating(true);
    try {
      const player = buildPlayer();
      const roomId = await createRoom(player);
      await sendMessage(roomId, {
        playerId: "system",
        username: "System",
        avatar: "",
        text: `${profile.username} membuat ruangan`,
        timestamp: Date.now(),
        type: "system",
      });
      router.push(`/room/${roomId}`);
    } catch (err) {
      console.error("Create room error:", err);
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinRoom() {
    if (!profile || !roomCode.trim()) return;
    setJoining(true);
    setJoinError("");
    try {
      const player = buildPlayer();
      const roomId = await joinRoom(roomCode.trim(), player);
      if (!roomId) {
        setJoinError("Kode tidak valid atau room tidak tersedia");
        return;
      }
      await sendMessage(roomId, {
        playerId: "system",
        username: "System",
        avatar: "",
        text: `${profile.username} bergabung`,
        timestamp: Date.now(),
        type: "system",
      });
      router.push(`/room/${roomId}`);
    } catch (err: any) {
      setJoinError(err?.message || "Gagal bergabung");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="min-h-dvh w-full flex justify-center bg-[#0E1116]">
      <div className="w-full max-w-md relative overflow-hidden flex flex-col sm:border-x sm:border-[#262B33]/30 shadow-2xl bg-[#0E1116]">
        {/* Background */}
        <div className="absolute inset-0 batik-overlay opacity-50 pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-[#C8A96B]/5 to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-md h-full min-h-dvh flex flex-col px-4 py-6 safe-top sm:border-x sm:border-[#262B33]/30 sm:bg-[#171B22]/10 sm:backdrop-blur-sm sm:shadow-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="font-display text-3xl font-black gradient-text">TANRA</h1>
            <p className="text-[#8A8F98] text-xs tracking-widest">DEDUKSI SOSIAL</p>
          </div>
          <div className="flex items-center gap-2">
            <InstallPrompt />
            <button
              onClick={logout}
              className="p-2 rounded-xl border border-[#262B33] text-[#8A8F98] hover:text-[#F5F5F5] hover:border-[#C8A96B]/30 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard glow className="flex items-center gap-4 mb-6 cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent("tanra-toggle-dev-btn"))}>
            <div className="relative">
              <img
                src={profile?.avatar}
                alt={profile?.username}
                className="w-14 h-14 rounded-full border-2 border-[#C8A96B]/30"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.username}`;
                }}
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#171B22]" />
            </div>
            <div>
              <p className="font-semibold text-[#F5F5F5]">{profile?.username}</p>
              <p className="text-[10px] text-[#C8A96B] font-bold tracking-wider uppercase mt-0.5">
                {profile ? (
                  profile.impostorWins && profile.impostorWins >= 5 ? "Master of Deception" :
                  profile.civilianWins && profile.civilianWins >= 10 ? "Detektif" :
                  profile.mrWhiteWins && profile.mrWhiteWins >= 3 ? "The Joker" :
                  profile.wins && profile.wins >= 5 ? "Veteran" :
                  "Pemula"
                ) : ""}
              </p>
            </div>
            <div className="ml-auto flex gap-4 text-right">
              <div>
                <p className="text-[#C8A96B] font-bold text-lg">{profile?.wins || 0}</p>
                <p className="text-[#8A8F98] text-xs">Menang</p>
              </div>
              <div>
                <p className="text-[#C8A96B] font-bold text-lg">{profile?.gamesPlayed || 0}</p>
                <p className="text-[#8A8F98] text-xs">Main</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Main Actions */}
        <div className="space-y-3">
          {/* Create Room */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.button
              onClick={handleCreateRoom}
              disabled={creating}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full relative overflow-hidden bg-gradient-to-r from-[#C8A96B] to-[#A08552] text-[#0E1116] rounded-2xl p-5 flex items-center gap-4 shadow-[0_0_30px_rgba(200,169,107,0.2)] disabled:opacity-60"
            >
              <div className="w-12 h-12 bg-[#0E1116]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Plus size={24} />
              </div>
              <div className="text-left">
                <p className="font-display font-bold text-lg">Buat Ruangan</p>
                <p className="text-sm opacity-80">Jadilah tuan rumah permainan</p>
              </div>
              {creating ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="ml-auto w-5 h-5 border-2 border-[#0E1116] border-t-transparent rounded-full"
                />
              ) : (
                <ChevronRight className="ml-auto" size={20} />
              )}
            </motion.button>
          </motion.div>

          {/* Join Room */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button
              onClick={() => setShowJoinModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-[#171B22] border border-[#262B33] text-[#F5F5F5] rounded-2xl p-5 flex items-center gap-4 hover:border-[#C8A96B]/30 transition-colors"
            >
              <div className="w-12 h-12 bg-[#0E1116] border border-[#262B33] rounded-xl flex items-center justify-center flex-shrink-0">
                <Hash size={20} className="text-[#C8A96B]" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-lg">Gabung Ruangan</p>
                <p className="text-sm text-[#8A8F98]">Masukkan kode ruangan</p>
              </div>
              <ChevronRight className="ml-auto text-[#8A8F98]" size={20} />
            </motion.button>
          </motion.div>

          {/* Quick Match - Coming Soon */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="w-full bg-[#171B22]/50 border border-[#262B33]/50 text-[#8A8F98] rounded-2xl p-5 flex items-center gap-4 opacity-50 cursor-not-allowed">
              <div className="w-12 h-12 bg-[#0E1116] border border-[#262B33] rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap size={20} className="text-[#8A8F98]" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-lg">Cepat Main</p>
                <p className="text-sm">Segera Hadir</p>
              </div>
              <span className="ml-auto text-xs bg-[#262B33] px-2 py-1 rounded-full">Soon</span>
            </div>
          </motion.div>
        </div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 p-4 bg-[#171B22] border border-[#262B33] rounded-2xl"
        >
          <p className="text-center text-[#8A8F98] text-xs leading-relaxed">
            Temukan siapa yang berpura-pura.<br />
            Berikan petunjuk, diskusikan, dan vote.
          </p>
          <div className="flex justify-center gap-6 mt-3">
            <div className="text-center">
              <p className="text-[#C8A96B] font-bold text-sm">4-8</p>
              <p className="text-[#8A8F98] text-xs">Pemain</p>
            </div>
            <div className="w-px bg-[#262B33]" />
            <div className="text-center">
              <p className="text-[#C8A96B] font-bold text-sm">1-2</p>
              <p className="text-[#8A8F98] text-xs">Penipu</p>
            </div>
            <div className="w-px bg-[#262B33]" />
            <div className="text-center">
              <p className="text-[#C8A96B] font-bold text-sm">5m</p>
              <p className="text-[#8A8F98] text-xs">Per Ronde</p>
            </div>
          </div>
        </motion.div>
      </div>
      </div>
      {/* Join Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowJoinModal(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="w-full max-w-sm bg-[#171B22]/90 backdrop-blur-xl border border-[#262B33] rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)] pointer-events-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display font-bold text-xl gradient-text">Gabung Ruangan</h2>
                  <button
                    onClick={() => setShowJoinModal(false)}
                    className="w-8 h-8 bg-[#262B33] rounded-full flex items-center justify-center text-[#8A8F98]"
                  >
                    <X size={16} />
                  </button>
                </div>

                <p className="text-[#8A8F98] text-sm mb-4">
                  Masukkan kode ruangan dari temanmu
                </p>

                <input
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase());
                    setJoinError("");
                  }}
                  placeholder="Contoh: 7FK2"
                  maxLength={8}
                  className="w-full bg-[#0E1116] border border-[#262B33] rounded-xl px-4 py-3.5 text-xl font-bold text-center text-[#F5F5F5] placeholder-[#8A8F98]/50 focus:border-[#C8A96B]/50 transition-colors tracking-widest mb-4"
                  autoFocus
                />

                <AnimatePresence>
                  {joinError && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[#A63D40] text-sm text-center mb-4"
                    >
                      {joinError}
                    </motion.p>
                  )}
                </AnimatePresence>

                <Button
                  onClick={handleJoinRoom}
                  loading={joining}
                  disabled={!roomCode.trim()}
                  fullWidth
                  size="lg"
                >
                  Masuk Sekarang
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
