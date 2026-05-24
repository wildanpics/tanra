"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/features/auth/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useRoom, updatePlayerReady } from "@/features/room/useRoom";
import { resetRoom } from "@/services/roomService";
import { Button } from "@/components/ui/Button";
import { Trophy, Skull, Shield, Home, RotateCcw } from "lucide-react";
import { Player } from "@/types";

export default function ResultPage() {
  const params = useParams();
  const roomId = params.id as string;
  const router = useRouter();
  const { profile } = useAuth();
  const { ready } = useAuthGuard({ requireAuth: true });
  const { room, loading } = useRoom(roomId);

  const gameState = room?.gameState;
  const winner = gameState?.winner;
  const players = Object.values(room?.players || {}) as Player[];
  const impostors = players.filter((p) => gameState?.impostorIds?.includes(p.id));
  const mrWhites = players.filter((p) => gameState?.mrWhiteIds?.includes(p.id));
  const civilians = players.filter((p) => !gameState?.impostorIds?.includes(p.id) && !gameState?.mrWhiteIds?.includes(p.id));
  const iWon =
    (winner === "civilian" && !gameState?.impostorIds?.includes(profile?.uid || "") && !gameState?.mrWhiteIds?.includes(profile?.uid || "")) ||
    (winner === "impostor" && gameState?.impostorIds?.includes(profile?.uid || "")) ||
    (winner === "mr_white" && gameState?.mrWhiteIds?.includes(profile?.uid || ""));

  const myPlayer = players.find((p) => p.id === profile?.uid);
  const isHost = room?.hostId === profile?.uid;
  const readyPlayers = players.filter(p => p.isReady).length;

  useEffect(() => {
    if (room?.status === "waiting") {
      router.push(`/room/${roomId}`);
    }
  }, [room?.status, roomId, router]);

  async function handlePlayAgain() {
    if (!profile) return;
    
    // Tandai diri sendiri siap main lagi
    await updatePlayerReady(roomId, profile.uid, true);
    
    if (isHost) {
      // Jika Host yang tekan, langsung reset ruangan ke Lobby!
      await resetRoom(roomId);
    }
  }

  if (!ready || loading) {
    return (
      <div className="min-h-dvh bg-[#0E1116] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-[#C8A96B] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0E1116] relative overflow-hidden flex flex-col items-center justify-center px-4">
      <div className="absolute inset-0 batik-overlay opacity-30" />

      {/* Radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className={`w-80 h-80 rounded-full blur-3xl ${winner === "civilian" ? "bg-[#C8A96B]" : "bg-[#A63D40]"}`}
        />
      </div>

      <div className="relative z-10 max-w-sm w-full">
        {/* Win/Lose announcement */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ rotate: iWon ? [0, -10, 10, -10, 0] : [0] }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-7xl mb-4 inline-block"
          >
            {iWon ? "🏆" : "💀"}
          </motion.div>
          <h1
            className={`font-display text-5xl font-black mb-2 ${
              iWon ? "gradient-text" : "text-[#A63D40]"
            }`}
          >
            {iWon ? "MENANG!" : "KALAH"}
          </h1>
          <p className="text-[#8A8F98]">
            {winner === "civilian" 
              ? "Warga berhasil menemukan penipu!" 
              : winner === "impostor"
              ? "Penipu berhasil menipu semua orang!"
              : "Si Kosong berhasil bertahan hidup!"}
          </p>
        </motion.div>

        {/* Word Reveal */}
        {gameState?.revealedWord && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#171B22] border border-[#262B33] rounded-2xl p-5 mb-4"
          >
            <p className="text-center text-[#8A8F98] text-xs mb-3 tracking-wider uppercase">Kata Permainan</p>
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-xs text-[#C8A96B] mb-1">Warga</p>
                <p className="font-display font-bold text-2xl gradient-text">
                  {gameState.revealedWord.civilian}
                </p>
              </div>
              <div className="w-px h-8 bg-[#262B33]" />
              <div className="text-center">
                <p className="text-xs text-[#A63D40] mb-1">Penipu</p>
                <p className="font-display font-bold text-2xl text-[#A63D40]">
                  {gameState.revealedWord.impostor}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Impostors Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-[#171B22] border border-[#262B33] rounded-2xl p-4 mb-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Skull size={14} className="text-[#A63D40]" />
            <p className="text-xs text-[#8A8F98] uppercase tracking-wider">Para Penipu</p>
          </div>
          <div className="space-y-2">
            {impostors.map((imp, i) => (
              <motion.div
                key={imp.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="flex items-center gap-3 p-2 bg-[#A63D40]/10 rounded-xl border border-[#A63D40]/20"
              >
                <img
                  src={imp.avatar}
                  alt={imp.username}
                  className="w-8 h-8 rounded-full border border-[#A63D40]/30"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${imp.username}`;
                  }}
                />
                <span className="font-medium text-sm text-[#F5F5F5]">{imp.username}</span>
                <span className="ml-auto text-xs text-[#A63D40]">Penipu</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Mr White Reveal */}
        {mrWhites.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="bg-[#171B22] border border-[#262B33] rounded-2xl p-4 mb-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Skull size={14} className="text-[#C8A96B]" />
              <p className="text-xs text-[#8A8F98] uppercase tracking-wider">Si Kosong (Mr White)</p>
            </div>
            <div className="space-y-2">
              {mrWhites.map((mw, i) => (
                <motion.div
                  key={mw.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.75 + i * 0.1 }}
                  className="flex items-center gap-3 p-2 bg-[#C8A96B]/10 rounded-xl border border-[#C8A96B]/20"
                >
                  <img
                    src={mw.avatar}
                    alt={mw.username}
                    className="w-8 h-8 rounded-full border border-[#C8A96B]/30"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${mw.username}`; }}
                  />
                  <span className="font-medium text-sm text-[#F5F5F5]">{mw.username}</span>
                  <span className="ml-auto text-xs text-[#C8A96B]">Kosong</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Players summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-[#171B22] border border-[#262B33] rounded-2xl p-4 mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Shield size={14} className="text-[#C8A96B]" />
            <p className="text-xs text-[#8A8F98] uppercase tracking-wider">Semua Pemain</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {players.map((player) => {
              const isImpostor = gameState?.impostorIds?.includes(player.id);
              const isMrWhite = gameState?.mrWhiteIds?.includes(player.id);
              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs ${
                    isImpostor
                      ? "bg-[#A63D40]/10 border-[#A63D40]/30 text-[#A63D40]"
                      : isMrWhite
                      ? "bg-[#C8A96B]/10 border-[#C8A96B]/30 text-[#C8A96B]"
                      : "bg-[#262B33]/50 border-[#262B33]/50 text-[#8A8F98]"
                  }`}
                >
                  <img
                    src={player.avatar}
                    alt={player.username}
                    className="w-5 h-5 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${player.username}`;
                    }}
                  />
                  {player.username}
                  {isImpostor ? " 🔺" : isMrWhite ? " 👻" : " ✓"}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => router.push("/home")}
            variant="primary"
            fullWidth
            size="lg"
            icon={<Home size={18} />}
          >
            Kembali ke Menu
          </Button>
          
          <div className="flex flex-col items-center gap-2">
            <Button
              onClick={handlePlayAgain}
              variant="secondary"
              fullWidth
              size="lg"
              icon={<RotateCcw size={18} />}
              disabled={myPlayer?.isReady && !isHost}
              className={myPlayer?.isReady && !isHost ? "opacity-70 border-[#C8A96B]" : ""}
            >
              {isHost ? "Mulai Ulang Permainan" : myPlayer?.isReady ? "Menunggu Host..." : "Main Lagi"}
            </Button>
            
            {readyPlayers > 0 && (
              <p className="text-[10px] text-[#8A8F98] uppercase tracking-widest mt-1">
                {readyPlayers} dari {players.length} pemain siap main lagi
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
