"use client";

import { useEffect, useRef, useState } from "react";
import { updateDoc, doc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as htmlToImage from "html-to-image";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/features/auth/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useRoom, updatePlayerReady } from "@/features/room/useRoom";
import { resetRoom } from "@/services/roomService";
import { Button } from "@/components/ui/Button";
import { Trophy, Skull, Shield, Home, RotateCcw, Share2, Users, Clock, Flag } from "lucide-react";
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
  const jesters = players.filter((p) => gameState?.jesterIds?.includes(p.id));
  const civilians = players.filter((p) => !gameState?.impostorIds?.includes(p.id) && !gameState?.mrWhiteIds?.includes(p.id) && !gameState?.jesterIds?.includes(p.id));
  const iWon =
    (winner === "civilian" && !gameState?.impostorIds?.includes(profile?.uid || "") && !gameState?.mrWhiteIds?.includes(profile?.uid || "") && !gameState?.jesterIds?.includes(profile?.uid || "")) ||
    (winner === "impostor" && gameState?.impostorIds?.includes(profile?.uid || "")) ||
    (winner === "mr_white" && gameState?.mrWhiteIds?.includes(profile?.uid || "")) ||
    (winner === "jester" && gameState?.jesterIds?.includes(profile?.uid || ""));

  const myPlayer = players.find((p) => p.id === profile?.uid);
  const isHost = room?.hostId === profile?.uid;
  const readyPlayers = players.filter(p => p.isReady).length;

  const durationMs = (gameState?.startedAt && gameState?.endedAt) 
    ? Math.max(0, gameState.endedAt - gameState.startedAt) 
    : 0;
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  const formattedDuration = durationMs > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : "00:00";
  
  const isJesterWin = winner === "jester";
  const bgGlowClass = isJesterWin ? "bg-purple-600/30" : iWon ? "bg-[#C8A96B]/30" : "bg-[#FF1E1E]/20";
  const avatarRingClass = isJesterWin ? "bg-purple-600/30 shadow-[0_0_50px_rgba(147,51,234,0.3)]" : iWon ? "bg-[#C8A96B]/30 shadow-[0_0_50px_rgba(200,169,107,0.3)]" : "bg-[#FF1E1E]/20";
  const avatarBorderClass = isJesterWin ? "border-purple-600" : iWon ? "border-[#C8A96B]" : "border-[#FF1E1E]";
  const avatarBgClass = isJesterWin ? "bg-purple-600" : iWon ? "bg-[#C8A96B]" : "bg-[#CC2222]";
  const titleText = isJesterWin ? (myPlayer?.role === "jester" ? "MASTER TROLL" : "PRANKED!") : iWon ? "VICTORY" : "DEFEAT";
  const titleColor = isJesterWin ? "text-purple-500" : iWon ? "text-[#C8A96B]" : "text-[#CC2222]";
  const titleGlowColor = isJesterWin ? "text-purple-600/[0.05]" : iWon ? "text-[#C8A96B]/[0.05]" : "text-[#A63D40]/[0.05]";

  useEffect(() => {
    if (room?.status === "waiting") {
      router.push(`/room/${roomId}`);
    }
  }, [room?.status, roomId, router]);

  const resultCardRef = useRef<HTMLDivElement>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!profile || !winner || !myPlayer) return;
    const cacheKey = `TANRA_STATS_${roomId}`;
    if (localStorage.getItem(cacheKey)) return;

    localStorage.setItem(cacheKey, "true");

    const isImpostor = gameState?.impostorIds?.includes(profile.uid);
    const isMrWhite = gameState?.mrWhiteIds?.includes(profile.uid);
    const isJester = gameState?.jesterIds?.includes(profile.uid);
    const isCivilian = !isImpostor && !isMrWhite && !isJester;

    // Increment stats in Firestore
    const updates: Record<string, any> = {
      gamesPlayed: increment(1)
    };
    if (iWon) {
      updates.wins = increment(1);
      if (isImpostor) updates.impostorWins = increment(1);
      if (isMrWhite) updates.mrWhiteWins = increment(1);
      if (isJester) updates.jesterWins = increment(1);
      if (isCivilian) updates.civilianWins = increment(1);
    }

    updateDoc(doc(db, "users", profile.uid), updates).catch(console.error);
  }, [profile, winner, myPlayer, roomId, iWon, gameState]);

  async function handleShare() {
    if (!shareCardRef.current) return;
    setSharing(true);
    setIsGenerating(true);
    
    // Wait for the DOM to update and images to load
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const dataUrl = await htmlToImage.toPng(shareCardRef.current, {
        cacheBust: true,
        quality: 1,
        pixelRatio: 2,
        style: {
          background: "#050505",
          transform: "none",
        }
      });
      
      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `TANRA-Result-${roomId}.png`, { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'TANRA: Hasil Permainan',
            text: iWon ? 'Kami berhasil menang di game TANRA! 😎 #TanraGame' : 'Kalah telak di TANRA... 💀 #TanraGame',
            files: [file]
          });
        } else {
          // Fallback jika device/browser tidak support native share
          const link = document.createElement('a');
          link.download = `TANRA-Result-${roomId}.png`;
          link.href = dataUrl;
          link.click();
        }
      } catch (shareErr: any) {
        if (shareErr.name !== 'AbortError') {
          console.error("Gagal Web Share:", shareErr);
          // Fallback ke download biasa jika share gagal (bukan karena dicancel user)
          const link = document.createElement('a');
          link.download = `TANRA-Result-${roomId}.png`;
          link.href = dataUrl;
          link.click();
        }
      }
    } catch (err) {
      console.error("Gagal share:", err);
      alert("Gagal membuat gambar, silakan coba lagi.");
    } finally {
      setIsGenerating(false);
      setSharing(false);
    }
  }

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
          className={`w-80 h-80 rounded-full blur-3xl ${isJesterWin ? "bg-purple-600/30" : winner === "civilian" ? "bg-[#C8A96B]" : "bg-[#A63D40]"}`}
        />
      </div>

      <div className="relative z-10 max-w-sm w-full pb-32">
        <div ref={resultCardRef} className="p-4 rounded-3xl">
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
              {isJesterWin ? "🤡" : iWon ? "🏆" : "💀"}
            </motion.div>
            <h1
              className={`font-display text-5xl font-black mb-2 ${
                isJesterWin ? "text-purple-500" : iWon ? "gradient-text" : "text-[#A63D40]"
              }`}
            >
              {isJesterWin ? (myPlayer?.role === "jester" ? "MASTER TROLL" : "KENA TIPU!") : iWon ? "MENANG!" : "KALAH"}
            </h1>
            <p className="text-[#8A8F98]">
              {winner === "civilian" 
                ? "Warga berhasil menemukan penipu!" 
                : winner === "impostor"
                ? "Penipu berhasil menipu semua orang!"
                : winner === "jester"
                ? "Si Badut berhasil memperdaya kalian untuk mengeksekusinya!"
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
                    crossOrigin="anonymous"
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
                      crossOrigin="anonymous"
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

          {/* Jester Reveal */}
          {jesters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.68 }}
              className="bg-[#171B22] border border-[#262B33] rounded-2xl p-4 mb-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🤡</span>
                <p className="text-xs text-[#8A8F98] uppercase tracking-wider">Si Badut (Jester)</p>
              </div>
              <div className="space-y-2">
                {jesters.map((j, i) => (
                  <motion.div
                    key={j.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.78 + i * 0.1 }}
                    className="flex items-center gap-3 p-2 bg-purple-900/20 rounded-xl border border-purple-500/30"
                  >
                    <img
                      src={j.avatar}
                      alt={j.username}
                      crossOrigin="anonymous"
                      className="w-8 h-8 rounded-full border border-purple-500/50"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${j.username}`; }}
                    />
                    <span className="font-medium text-sm text-[#F5F5F5]">{j.username}</span>
                    <span className="ml-auto text-xs text-purple-400">Badut</span>
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
            className="bg-[#171B22] border border-[#262B33] rounded-2xl p-4 mt-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} className="text-[#C8A96B]" />
              <p className="text-xs text-[#8A8F98] uppercase tracking-wider">Semua Pemain</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {players.map((player) => {
                const isImpostor = gameState?.impostorIds?.includes(player.id);
                const isMrWhite = gameState?.mrWhiteIds?.includes(player.id);
                const isJester = gameState?.jesterIds?.includes(player.id);
                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs ${
                      isImpostor
                        ? "bg-[#A63D40]/10 border-[#A63D40]/30 text-[#A63D40]"
                        : isMrWhite
                        ? "bg-[#C8A96B]/10 border-[#C8A96B]/30 text-[#C8A96B]"
                        : isJester
                        ? "bg-purple-900/20 border-purple-500/30 text-purple-400"
                        : "bg-[#262B33]/50 border-[#262B33]/50 text-[#8A8F98]"
                    }`}
                  >
                    <img
                      src={player.avatar}
                      alt={player.username}
                      crossOrigin="anonymous"
                      className="w-5 h-5 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${player.username}`;
                      }}
                    />
                    {player.username}
                    {isImpostor ? " 🔺" : isMrWhite ? " 👻" : isJester ? " 🤡" : " ✓"}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Fixed Action Buttons (Not shared) */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[400px] p-4 pb-6 bg-gradient-to-t from-[#0E1116] via-[#0E1116]/90 to-transparent z-50 space-y-3">
        <Button
            onClick={handleShare}
            variant="secondary"
            fullWidth
            size="lg"
            loading={sharing}
            icon={<Share2 size={18} />}
            className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white border-purple-500/30 hover:from-purple-600 hover:to-pink-600"
          >
            Pamerkan ke Sosmed
          </Button>

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

        {/* --- TEMPORARY CANVAS FOR SPOTIFY WRAPPED SHARE --- */}
        <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#050505] transition-opacity duration-300 ${isGenerating ? 'opacity-100' : 'opacity-0 pointer-events-none -z-50'}`}>
          <div ref={shareCardRef} className="relative overflow-hidden w-[460px] aspect-[9/16] p-8 bg-[#050505] flex flex-col border border-white/5 rounded-[40px]">
            
            {/* Background Glows (Red if lose, Gold if win, Purple if Jester) */}
            <div className={`absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full blur-[130px] opacity-70 ${bgGlowClass}`} />
            <div className={`absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-[150px] opacity-60 ${bgGlowClass}`} />

            {/* Giant Background Text */}
            <div className={`absolute top-[32%] left-1/2 -translate-x-1/2 -translate-y-1/2 font-display font-black text-[140px] tracking-tighter z-0 whitespace-nowrap pointer-events-none ${titleGlowColor}`}>
              {titleText}
            </div>

            {/* Header */}
            <div className="relative z-10 flex justify-between items-center w-full mb-8">
              <span className="font-display font-black text-[28px] tracking-[0.2em] text-[#888888]">TANRA</span>
              <span className="text-[9px] font-bold tracking-widest text-[#888888] uppercase bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/5">#TANRAGAME</span>
            </div>

            {/* Avatar & Title Area */}
            <div className="relative z-10 flex flex-col items-center mb-6">
              {/* Avatar with double glowing ring */}
              <div className="relative mb-5 mt-2">
                {/* Outer thin ring */}
                <div className={`absolute inset-[-18px] rounded-full border opacity-50 ${avatarBorderClass}`} />
                {/* Inner thick ring with shadow */}
                <div className={`relative p-1.5 rounded-full ${avatarRingClass}`}>
                  <div className={`w-28 h-28 rounded-full flex items-center justify-center font-display font-medium text-[50px] text-white shadow-inner ${avatarBgClass}`}>
                    {myPlayer?.username.substring(0, 2).toUpperCase()}
                  </div>
                </div>
                
                {/* Role Badge */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#0B0D12] border border-[#262B33] px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl whitespace-nowrap">
                  <span className={myPlayer?.role === "impostor" ? "text-white" : myPlayer?.role === "mr_white" ? "text-[#C8A96B]" : myPlayer?.role === "jester" ? "text-purple-400" : "text-[#F5F5F5]"}>
                    {myPlayer?.role === "impostor" ? "PENIPU" : myPlayer?.role === "jester" ? "SI BADUT" : myPlayer?.role === "mr_white" ? "SI KOSONG" : "WARGA"}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h1 className={`font-display text-[60px] font-black mt-4 mb-0 tracking-wider leading-none drop-shadow-2xl ${titleColor}`}>
                {titleText}
              </h1>
              <p className="text-[#666666] text-[12px] font-medium tracking-wide mt-1">
                {winner === "civilian" 
                  ? "Warga berhasil menemukan penipu!" 
                  : winner === "impostor"
                  ? "Penipu berhasil menipu semua orang!"
                  : winner === "jester"
                  ? "Si Badut berhasil menipu untuk dieksekusi!"
                  : "Si Kosong berhasil bertahan hidup!"}
              </p>
            </div>

            {/* Cards Area */}
            <div className="relative z-10 w-full flex flex-col gap-4 mt-auto">
              
              {/* Kata Permainan */}
              {gameState?.revealedWord && (
                <div className="bg-[#080808]/80 backdrop-blur-xl border border-[#2A1618] rounded-[24px] p-5 flex flex-col items-center shadow-lg">
                  <p className="text-[#666666] text-[9px] tracking-[0.2em] uppercase mb-4 font-semibold">Kata Permainan</p>
                  <div className="flex items-center justify-center w-full">
                    <div className="flex-1 text-center">
                      <p className="text-[10px] text-[#C8A96B] mb-1 font-medium">Warga</p>
                      <p className="font-display font-bold text-3xl text-[#C8A96B] tracking-wider drop-shadow-md">{gameState.revealedWord.civilian}</p>
                    </div>
                    <div className="w-px h-12 bg-[#2A1618]" />
                    <div className="flex-1 text-center">
                      <p className="text-[10px] text-[#A63D40] mb-1 font-medium">Penipu</p>
                      <p className="font-display font-bold text-3xl text-[#A63D40] tracking-wider drop-shadow-md">{gameState.revealedWord.impostor}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Para Penipu */}
              <div className="bg-[#080808]/80 backdrop-blur-xl border border-[#2A1618] rounded-[24px] p-4 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Skull size={12} className="text-[#A63D40]" />
                  <p className="text-[9px] text-[#666666] uppercase tracking-[0.2em] font-semibold">Para Penipu</p>
                </div>
                <div className="space-y-2">
                  {impostors.map((imp) => (
                    <div key={imp.id} className="flex items-center gap-3 p-2 bg-[#140A0A] rounded-[20px] border border-[#2A1618]">
                      <div className="w-9 h-9 rounded-full bg-[#CC2222] flex items-center justify-center font-display font-bold text-white text-sm">
                        {imp.username.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-[14px] text-[#F5F5F5]">{imp.username}</span>
                      <span className="ml-auto text-[11px] text-[#A63D40] font-medium px-3">Penipu</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Semua Pemain */}
              <div className="bg-[#080808]/80 backdrop-blur-xl border border-[#1A1A1A] rounded-[24px] p-4 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={12} className="text-[#C8A96B]" />
                  <p className="text-[9px] text-[#666666] uppercase tracking-[0.2em] font-semibold">Semua Pemain</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {players.map((player) => {
                    const isImpostor = gameState?.impostorIds?.includes(player.id);
                    const isMrWhite = gameState?.mrWhiteIds?.includes(player.id);
                    const isJester = gameState?.jesterIds?.includes(player.id);
                    return (
                      <div key={player.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-full border text-[10px] font-medium ${
                        isImpostor ? "bg-[#140A0A] border-[#2A1618] text-[#A63D40]" : isMrWhite ? "bg-[#14110A] border-[#2A2316] text-[#C8A96B]" : isJester ? "bg-[#120A1A] border-[#20162A] text-purple-400" : "bg-[#111111] border-[#222222] text-[#888888]"
                      }`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center font-display font-bold text-[8px] text-white ${
                          isImpostor ? "bg-[#CC2222]" : isMrWhite ? "bg-[#C8A96B]" : isJester ? "bg-purple-600" : "bg-[#333333]"
                        }`}>
                          {player.username.substring(0, 1).toUpperCase()}
                        </div>
                        {player.username}
                      </div>
                    );
                  })}
                </div>
              </div>
              
            </div>

            {/* Footer Stats */}
            <div className="relative z-10 flex justify-center items-center gap-10 mt-6 pt-5 border-t border-[#1A1A1A]">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-[#888888]">
                  <Users size={14} className="opacity-80" />
                  <span className="text-[14px] font-bold text-[#CCCCCC]">{players.length}</span>
                </div>
                <span className="text-[7px] text-[#555555] uppercase tracking-[0.2em] mt-1.5 font-bold">Pemain</span>
              </div>
              <div className="w-px h-6 bg-[#1A1A1A]" />
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-[#888888]">
                  <Clock size={14} className="opacity-80" />
                  <span className="text-[14px] font-bold text-[#CCCCCC]">{formattedDuration}</span>
                </div>
                <span className="text-[7px] text-[#555555] uppercase tracking-[0.2em] mt-1.5 font-bold">Durasi</span>
              </div>
              <div className="w-px h-6 bg-[#1A1A1A]" />
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-[#888888]">
                  <Flag size={14} className="opacity-80" />
                  <span className="text-[14px] font-bold text-[#CCCCCC]">{gameState?.round || 1}</span>
                </div>
                <span className="text-[7px] text-[#555555] uppercase tracking-[0.2em] mt-1.5 font-bold">Round</span>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
