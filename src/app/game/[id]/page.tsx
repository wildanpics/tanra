"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/features/auth/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useRoom, useMessages, sendMessage, castVote, updateGameState } from "@/features/room/useRoom";
import { advancePhase, eliminatePlayer, endGame, claimHost } from "@/services/roomService";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Timer } from "@/components/ui/Timer";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { ChatPanel } from "@/components/game/ChatPanel";
import { MicButton } from "@/components/game/MicButton";
import { RoleReveal } from "@/components/game/RoleReveal";
import { VotingPanel } from "@/components/game/VotingPanel";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { useBotLogic } from "@/hooks/useBotLogic";
import { Player, GamePhase } from "@/types";
import { getPhaseLabel } from "@/lib/utils";
import { LogOut, Mic, MicOff, MessageCircle, X, Users, Play, XOctagon, Eye, EyeOff, FastForward, PenLine } from "lucide-react";

export default function GamePage() {
  const params = useParams();
  const roomId = params.id as string;
  const router = useRouter();
  const { profile } = useAuth();
  const { ready } = useAuthGuard({ requireAuth: true });
  const { room, loading } = useRoom(roomId);
  const messages = useMessages(roomId);

  const [showChat, setShowChat] = useState(false);
  const [showRoleReveal, setShowRoleReveal] = useState(false);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [showWordHint, setShowWordHint] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [flyingEmotes, setFlyingEmotes] = useState<{id: string, emoji: string, left: number}[]>([]);
  const [toastMessages, setToastMessages] = useState<{id: string, username: string, text: string}[]>([]);
  const [showSabotageSelect, setShowSabotageSelect] = useState(false);
  
  const [showMrWhiteGuess, setShowMrWhiteGuess] = useState(false);
  const [mrWhiteGuess, setMrWhiteGuess] = useState("");
  const [justDied, setJustDied] = useState(false);
  const prevIsAlive = useRef<boolean | undefined>(undefined);

  const [showNotepad, setShowNotepad] = useState(false);
  const [notepadText, setNotepadText] = useState("");

  // Load notepad
  useEffect(() => {
    if (roomId && profile?.uid) {
      const saved = localStorage.getItem(`TANRA_NOTES_${roomId}_${profile.uid}`);
      if (saved) setNotepadText(saved);
    }
  }, [roomId, profile?.uid]);

  // Save notepad
  useEffect(() => {
    if (roomId && profile?.uid) {
      localStorage.setItem(`TANRA_NOTES_${roomId}_${profile.uid}`, notepadText);
    }
  }, [notepadText, roomId, profile?.uid]);
  const { initAudio, playTick, playDramaticReveal, playElimination, startBGM, stopBGM } = useAudioEngine();

  const [lkToken, setLkToken] = useState<string | null>(null);
  useEffect(() => {
    if (!profile || !roomId) return;
    async function fetchToken() {
      try {
        const res = await fetch("/api/livekit-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomName: roomId,
            userId: profile!.uid,
            username: profile!.username,
          }),
        });
        const data = await res.json();
        if (data.token) {
          setLkToken(data.token);
        }
      } catch (err) {
        console.error("Gagal mendapatkan token LiveKit", err);
      }
    }
    fetchToken();
  }, [profile, roomId]);

  const { isMuted, toggleMute, setMuteState, speakingParticipants: speakingPlayers, connected } = useVoiceChat({
    roomName: roomId,
    userId: profile?.uid || "",
    username: profile?.username || "",
    token: lkToken,
    livekitUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL || "",
  });

  useEffect(() => {
    initAudio();
  }, [initAudio]);

  const gameState = room?.gameState;
  const phase = gameState?.phase as GamePhase;
  const allPlayers = Object.values(room?.players || {}) as Player[];
  const players = allPlayers.filter((p) => !p.isGhost);
  const me = allPlayers.find((p) => p.id === profile?.uid);
  const alivePlayers = players.filter((p) => p.isAlive);
  const isHost = room?.hostId === profile?.uid;
  const isDev = profile?.email === "mwildanfiqri88@gmail.com";
  const [isAllSeeing, setIsAllSeeing] = useState(false);

  useEffect(() => {
    setIsAllSeeing(isDev && localStorage.getItem("TANRA_ALL_SEEING") === "true");
  }, [isDev]);

  const myWord = me?.word;
  const myRole = me?.role;
  const isSabotaged = gameState?.sabotagedPlayerId === profile?.uid;
  const isMyTurn =
    phase === "clue" &&
    gameState?.clueOrder?.[gameState?.currentClueIndex ?? 0] === profile?.uid;

  useEffect(() => {
    if (phase === "role-reveal") {
      setShowRoleReveal(true);
    } else {
      setShowRoleReveal(false);
    }
  }, [phase]);

  useEffect(() => {
    if (me?.votedFor) {
      setHasVoted(true);
      setSelectedVote(me.votedFor);
    } else {
      setHasVoted(false);
      setSelectedVote(null);
    }
  }, [me?.votedFor]);

  // Handle Death Overlay
  useEffect(() => {
    if (prevIsAlive.current === true && me?.isAlive === false) {
      setJustDied(true);
      playElimination();
      setTimeout(() => setJustDied(false), 3000);
    }
    prevIsAlive.current = me?.isAlive;
  }, [me?.isAlive, playElimination]);

  // Host AFK check
  const [hostIsAFK, setHostIsAFK] = useState(false);
  useEffect(() => {
    if (isHost || !gameState?.timerEnd) {
      setHostIsAFK(false);
      return;
    }
    const interval = setInterval(() => {
      const remaining = gameState.timerEnd! - Date.now();
      setHostIsAFK(remaining <= -10000); // 10 seconds past 0
    }, 1000);
    return () => clearInterval(interval);
  }, [isHost, gameState?.timerEnd]);

  async function handleClaimHost() {
    if (!profile || !room) return;
    await claimHost(roomId, profile.uid, room.hostId);
  }

  async function submitMrWhiteGuess() {
    if (!room || !profile) return;
    const civilianWord = players.find(p => p.role === "civilian")?.word || "";
    const endWordImpostor = players.find(p => p.role === "impostor")?.word || "";
    
    if (mrWhiteGuess.trim().toLowerCase() === civilianWord.toLowerCase()) {
      await endGame(roomId, "mr_white", { civilian: civilianWord, impostor: endWordImpostor });
      router.push(`/result/${roomId}`);
    } else {
      setShowMrWhiteGuess(false);
      playElimination();
      await eliminatePlayer(roomId, profile.uid);
      await sendMessage(roomId, {
        playerId: "system",
        username: "System",
        avatar: "",
        text: `${profile.username} (Mr. White) salah menebak kata dan bunuh diri!`,
        timestamp: Date.now(),
        type: "system",
      });
    }
  }

  // Handle game aborted or finished
  useEffect(() => {
    if (room?.status === "waiting") {
      router.push(`/room/${roomId}`);
    } else if (room?.status === "finished") {
      router.push(`/result/${roomId}`);
    }
  }, [room?.status, roomId, router]);

  async function forceEndGame() {
    if (!isHost) return;
    
    if (!confirmEnd) {
      setConfirmEnd(true);
      setTimeout(() => setConfirmEnd(false), 3000);
      return;
    }
    
    // reset status back to waiting so everyone returns to lobby
    await advancePhase(roomId, "waiting", 0, {
      status: "waiting"
    });
  }

  // Auto-Mic vs Open Mic & BGM SFX
  useEffect(() => {
    if (phase === "role-reveal") {
      playDramaticReveal();
    }
    
    if (phase === "discussion") {
      startBGM();
    } else {
      stopBGM();
    }

    if (room?.settings.micMode === "open") {
      setMuteState(false);
    } else {
      if (isMyTurn) {
        setMuteState(false);
      } else if (phase === "clue" && !isMyTurn) {
        setMuteState(true);
      }
    }
  }, [isMyTurn, phase, room?.settings.micMode, playDramaticReveal, startBGM, stopBGM, setMuteState]);

  // Handle Live Emotes & Chat Toast
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || Date.now() - lastMsg.timestamp > 3000) return;

    if (lastMsg.type === "emote") {
      const id = lastMsg.id + Math.random().toString();
      setFlyingEmotes(prev => [...prev, { id, emoji: lastMsg.text, left: 10 + Math.random() * 80 }]);
      setTimeout(() => {
        setFlyingEmotes(prev => prev.filter(e => e.id !== id));
      }, 2000); // Bersihkan tepat setelah animasi selesai
    } else if ((!lastMsg.type || lastMsg.type === "chat") && !showChat && lastMsg.playerId !== profile?.uid) {
      setToastMessages(prev => {
        if (prev.find(m => m.id === lastMsg.id)) return prev;
        return [...prev.slice(-2), { id: lastMsg.id, username: lastMsg.username, text: lastMsg.text }];
      });
      setTimeout(() => {
        setToastMessages(prev => prev.filter(m => m.id !== lastMsg.id));
      }, 3500);
    }
  }, [messages, showChat, profile?.uid]);

  async function sendEmote(emoji: string) {
    if (!profile) return;
    await sendMessage(roomId, {
      playerId: profile.uid,
      username: profile.username || "Unknown",
      avatar: profile.avatar || "",
      text: emoji,
      timestamp: Date.now(),
      type: "emote"
    });
  }

  // Mainkan suara detak jam saat waktu tersisa <= 10 detik
  useEffect(() => {
    if (!gameState?.timerEnd) return;
    const interval = setInterval(() => {
      const remaining = Math.round((gameState.timerEnd! - Date.now()) / 1000);
      if (remaining > 0 && remaining <= 10 && phase !== "voting-reveal") {
        playTick();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState?.timerEnd, playTick, phase]);

  // Fast drumroll tick for voting-reveal
  useEffect(() => {
    if (phase === "voting-reveal") {
      let ticks = 0;
      const interval = setInterval(() => {
        playTick();
        ticks++;
        if (ticks > 10) clearInterval(interval);
      }, 350);
      return () => clearInterval(interval);
    }
  }, [phase, playTick]);

  const handleNextTurn = useCallback(async () => {
    if (!room) return;
    if (phase === "clue") {
      const nextIdx = (gameState?.currentClueIndex ?? 0) + 1;
      if (nextIdx >= (gameState?.clueOrder?.length ?? 0)) {
        await advancePhase(roomId, "discussion", room.settings.discussionTime);
      } else {
        await advancePhase(roomId, "clue", room.settings.clueTime, {
          "gameState.currentClueIndex": nextIdx,
        });
      }
    }
  }, [room, phase, roomId, gameState?.currentClueIndex, gameState?.clueOrder?.length]);

  // Bot Logic Hook (Only runs if user is Host)
  useBotLogic(room, isHost, handleNextTurn);


  async function skipPhase() {
    if (!isHost) return;
    if (phase === "role-reveal") {
      await advancePhase(roomId, "clue", room!.settings?.clueTime || 60, {
        "gameState.currentClueIndex": 0,
      });
    } else if (phase === "clue") {
      const nextIdx = (gameState?.currentClueIndex ?? 0) + 1;
      if (nextIdx >= (gameState?.clueOrder?.length ?? 0)) {
        await advancePhase(roomId, "discussion", room!.settings?.discussionTime || 120);
      } else {
        await advancePhase(roomId, "clue", room!.settings?.clueTime || 60, {
          "gameState.currentClueIndex": nextIdx,
        });
      }
    } else if (phase === "discussion") {
      await advancePhase(roomId, "voting", room!.settings?.votingTime || 60);
    } else if (phase === "voting") {
      await processVotes();
    } else if (phase === "voting-reveal") {
      await executeVotingResult();
    }
  }

  // Auto-advance phases (host only)
  useEffect(() => {
    if (!isHost || !gameState?.timerEnd) return;
    
    const remaining = gameState.timerEnd - Date.now();
    
    if (remaining <= 0) {
      skipPhase();
      return;
    }

    const timeout = setTimeout(skipPhase, remaining);
    return () => clearTimeout(timeout);
  }, [isHost, phase, gameState?.timerEnd]);

  async function processVotes() {
    if (!room || !isHost) return;

    const voteCount: Record<string, number> = {};
    alivePlayers.forEach((p) => {
      if (p.votedFor) {
        voteCount[p.votedFor] = (voteCount[p.votedFor] || 0) + 1;
      }
    });

    const maxVotes = Math.max(...Object.values(voteCount), 0);
    
    let eliminated: string | undefined;
    if (maxVotes > 0) {
      // Find all players with maxVotes
      const topVoted = Object.entries(voteCount).filter(([, v]) => v === maxVotes).map(([id]) => id);
      // Eliminate only if there is a single player with the most votes (no tie)
      if (topVoted.length === 1) {
        eliminated = topVoted[0];
      }
    }

    // Instead of executing immediately, go to voting-reveal phase for 5 seconds
    await advancePhase(roomId, "voting-reveal", 5, {
      "gameState.eliminatedPending": eliminated || null,
    });
  }

  async function executeVotingResult() {
    if (!room || !isHost) return;
    
    const eliminated = gameState?.eliminatedPending;

    if (eliminated) {
      const isJester = gameState?.jesterIds?.includes(eliminated);
      const eliminatedPlayer = players.find((p) => p.id === eliminated);

      if (isJester) {
        playElimination();
        await eliminatePlayer(roomId, eliminated);
        const endWordCivilian = players.find(p => p.role === "civilian")?.word || "";
        const endWordImpostor = players.find(p => p.role === "impostor")?.word || "";
        
        await sendMessage(roomId, {
          playerId: "system",
          username: "System",
          avatar: "",
          text: `HAHAHA! ${eliminatedPlayer?.username} adalah JESTER! Mereka berhasil menipu kalian untuk mem-vote-nya!`,
          timestamp: Date.now(),
          type: "system",
        });
        
        await endGame(roomId, "jester", { civilian: endWordCivilian, impostor: endWordImpostor });
        return; // Jester wins instantly!
      }

      playElimination();
      await eliminatePlayer(roomId, eliminated);
      const isImpostor = gameState?.impostorIds?.includes(eliminated);
      
      await sendMessage(roomId, {
        playerId: "system",
        username: "System",
        avatar: "",
        text: room?.settings.hiddenDeath 
          ? `${eliminatedPlayer?.username} disingkirkan! Identitasnya dirahasiakan.`
          : `${eliminatedPlayer?.username} disingkirkan! ${isImpostor ? "Mereka adalah PENIPU!" : "Mereka bukan penipu..."}`,
        timestamp: Date.now(),
        type: "system",
      });
    } else {
      await sendMessage(roomId, {
        playerId: "system",
        username: "System",
        avatar: "",
        text: "Suara seimbang atau tidak ada yang memilih. Tidak ada yang disingkirkan ronde ini.",
        timestamp: Date.now(),
        type: "system",
      });
    }

    // CHECK WIN CONDITIONS (Always evaluated after voting)
    const remainingImpostors = (gameState?.impostorIds || []).filter((id) => id !== eliminated && players.find(p => p.id === id)?.isAlive);
    const remainingMrWhites = (gameState?.mrWhiteIds || []).filter((id) => id !== eliminated && players.find(p => p.id === id)?.isAlive);
    const remainingCivilians = alivePlayers.filter(
      (p) => !gameState?.impostorIds?.includes(p.id) && !gameState?.mrWhiteIds?.includes(p.id) && p.id !== eliminated
    );

    const isRoundLimitReached = (gameState?.round || 1) >= 2;

    const endWordCivilian = players.find(p => !gameState?.impostorIds?.includes(p.id) && !gameState?.mrWhiteIds?.includes(p.id))?.word || "";
    const endWordImpostor = players.find(p => gameState?.impostorIds?.includes(p.id))?.word || "";

    // Civilian wins if NO impostors AND NO mr whites
    if (remainingImpostors.length === 0 && remainingMrWhites.length === 0) {
      await endGame(roomId, "civilian", { civilian: endWordCivilian, impostor: endWordImpostor });
      router.push(`/result/${roomId}`);
      return;
    }

    // Mr White wins if they survived to the end
    if (remainingMrWhites.length > 0 && isRoundLimitReached) {
      await endGame(roomId, "mr_white", { civilian: endWordCivilian, impostor: endWordImpostor });
      router.push(`/result/${roomId}`);
      return;
    }

    // Impostor wins if they equal/outnumber civilians, OR if they survived 2 rounds!
    if (remainingImpostors.length >= remainingCivilians.length || isRoundLimitReached) {
      await endGame(roomId, "impostor", { civilian: endWordCivilian, impostor: endWordImpostor });
      router.push(`/result/${roomId}`);
      return;
    }

    const newClueOrder = (gameState?.clueOrder || []).filter(id => id !== eliminated && players.find(p => p.id === id)?.isAlive);

    // Reset votes for next round
    const extraUpdates: Record<string, unknown> = {
      "gameState.round": (gameState?.round || 1) + 1,
      "gameState.currentClueIndex": 0,
      "gameState.clueOrder": newClueOrder,
      "gameState.eliminatedPending": null, // clean up
    };
    
    players.forEach(p => {
      extraUpdates[`players.${p.id}.votedFor`] = null;
    });

    // Reset state locally so UI updates immediately
    setHasVoted(false);
    setSelectedVote(null);

    // Next round
    await advancePhase(roomId, "clue", room!.settings?.clueTime || 60, extraUpdates);
  }

  async function handleVote(targetId: string) {
    if (!profile || hasVoted || phase !== "voting" || !me?.isAlive) return;
    setSelectedVote(targetId);
    setHasVoted(true);
    await castVote(roomId, profile.uid, targetId);
  }

  if (!ready || loading) {
    return (
      <div className="min-h-dvh bg-[#0E1116] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-[#C8A96B] border-t-transparent rounded-full" />
      </div>
    );
  }

  const phaseColors: Record<string, string> = {
    "role-reveal": "text-[#C8A96B]",
    clue: "text-blue-400",
    discussion: "text-green-400",
    voting: "text-[#A63D40]",
    result: "text-[#C8A96B]",
  };

  return (
    <div className="min-h-dvh w-full flex justify-center bg-[#0E1116]">
      <div className="w-full max-w-md relative overflow-hidden flex flex-col sm:border-x sm:border-[#262B33]/30 shadow-2xl bg-[#0E1116]">
        <div className="absolute inset-0 batik-overlay opacity-20 pointer-events-none" />

      {/* Voting Reveal Overlay (Drumroll) */}
      <AnimatePresence>
        {phase === "voting-reveal" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-[#0E1116] flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(166,61,64,0.3)_0%,transparent_60%)] pointer-events-none"
            />
            <motion.h2
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-[#F5F5F5] font-display text-2xl font-black z-10 mb-8 tracking-widest text-center"
            >
              MENGHITUNG SUARA...
            </motion.h2>
            
            {gameState?.eliminatedPending && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 2, type: "spring", stiffness: 200, damping: 20 }}
                className="z-10 flex flex-col items-center relative"
              >
                <img
                  src={players.find(p => p.id === gameState.eliminatedPending)?.avatar}
                  className="w-32 h-32 rounded-full border-4 border-[#A63D40] shadow-[0_0_50px_rgba(166,61,64,0.8)]"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${players.find(p => p.id === gameState.eliminatedPending)?.username}`; }}
                />
                <p className="mt-4 text-white text-2xl font-bold">
                  {players.find(p => p.id === gameState.eliminatedPending)?.username}
                </p>
                <motion.div
                  initial={{ opacity: 0, scale: 5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 4, duration: 0.2 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="border-8 border-[#A63D40] text-[#A63D40] text-4xl font-black px-6 py-2 rotate-[-15deg] bg-black/50 backdrop-blur-sm whitespace-nowrap shadow-2xl rounded-lg uppercase tracking-widest">
                    DISINGKIRKAN
                  </div>
                </motion.div>
              </motion.div>
            )}
            
            {!gameState?.eliminatedPending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="z-10 text-white text-xl font-bold px-8 text-center"
              >
                SUARA SEIMBANG! TIDAK ADA YANG DIEKSEKUSI
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Role Reveal Overlay */}
      <AnimatePresence>
        {showRoleReveal && me && (
          <RoleReveal
            role={myRole!}
            word={myWord!}
            partnerNames={
              myRole === "impostor"
                ? (gameState?.impostorIds || [])
                    .filter(id => id !== profile?.uid)
                    .map(id => players.find(p => p.id === id)?.username)
                    .filter(Boolean) as string[]
                : undefined
            }
            onClose={() => setShowRoleReveal(false)}
          />
        )}
      </AnimatePresence>

      {/* Sabotage Overlay */}
      <AnimatePresence>
        {showSabotageSelect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#0E1116]/95 backdrop-blur-sm flex flex-col items-center justify-center p-6"
          >
            <h3 className="text-[#A63D40] font-display font-bold text-2xl mb-2">SABOTASE</h3>
            <p className="text-[#8A8F98] text-sm text-center mb-6">Pilih 1 pemain untuk dibungkam (Mute Chat) selama fase Diskusi ini.</p>
            
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-6">
              {alivePlayers.filter(p => p.id !== profile?.uid && p.role !== "impostor").map((p) => (
                <button
                  key={p.id}
                  onClick={async () => {
                    await updateGameState(roomId, { sabotagedPlayerId: p.id, sabotageUsed: true });
                    setShowSabotageSelect(false);
                  }}
                  className="bg-[#0E1116] border border-[#262B33] rounded-xl p-3 flex flex-col items-center gap-2 hover:border-[#A63D40]/50 hover:bg-[#A63D40]/10 transition-colors"
                >
                  <PlayerAvatar player={p} size="sm" />
                  <p className="text-sm font-bold text-[#F5F5F5] truncate w-full text-center">{p.username}</p>
                </button>
              ))}
            </div>
            
            <Button variant="secondary" onClick={() => setShowSabotageSelect(false)}>Batal</Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mr White Guess Modal */}
      <AnimatePresence>
        {showMrWhiteGuess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#0E1116]/95 backdrop-blur-sm flex flex-col items-center justify-center p-6"
          >
            <h3 className="text-white font-display font-bold text-2xl mb-2">TEBAK KATA WARGA</h3>
            <p className="text-[#8A8F98] text-sm text-center mb-6">Jika kamu benar, kamu memenangkan permainan. Jika salah, kamu langsung mati.</p>
            
            <input
              value={mrWhiteGuess}
              onChange={(e) => setMrWhiteGuess(e.target.value)}
              placeholder="Masukkan tebakanmu..."
              className="w-full max-w-xs bg-[#0E1116] border border-[#262B33] rounded-xl px-4 py-3 text-center text-white mb-6 focus:border-[#C8A96B]"
            />
            
            <div className="flex gap-3 w-full max-w-xs">
              <Button variant="secondary" onClick={() => setShowMrWhiteGuess(false)} fullWidth>Batal</Button>
              <Button onClick={submitMrWhiteGuess} className="bg-[#A63D40] hover:bg-red-600 border-none text-white" fullWidth>Tembak!</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Eliminated Jump Scare Overlay */}
      <AnimatePresence>
        {justDied && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6"
          >
            <motion.div
              animate={{ x: [-10, 10, -10, 10, 0], y: [-10, 10, -10, 10, 0] }}
              transition={{ duration: 0.4, ease: "easeInOut", repeat: 2 }}
            >
              <h1 className="text-red-600 font-display font-black text-5xl md:text-6xl text-center uppercase tracking-tighter mix-blend-screen drop-shadow-[0_0_30px_rgba(220,38,38,0.8)]">
                KAMU DISINGKIRKAN
              </h1>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        
      {/* TOP BAR (Floating Pill) */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex items-center justify-between mx-4 mt-16 mb-4 px-6 py-3.5 glass rounded-2xl shadow-xl border border-[#C8A96B]/20"
        >
          <div>
            <p className={`phase-badge font-bold tracking-widest ${phaseColors[phase] || "text-[#C8A96B]"}`}>
              {getPhaseLabel(phase)}
            </p>
            <p className="text-[#8A8F98] text-[10px] uppercase tracking-wider mt-0.5">
              Ronde {gameState?.round} • Ruang {room?.code}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {hostIsAFK && !isHost && (
              <Button onClick={handleClaimHost} size="sm" className="bg-[#A63D40]/80 border border-[#A63D40] text-xs h-8 mr-2 hover:bg-[#A63D40] text-white">
                Ambil Alih Host
              </Button>
            )}
            {isHost && (
              <>
                <button 
                  onClick={skipPhase}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#C8A96B]/20 text-[#C8A96B] border border-[#C8A96B]/30 hover:bg-[#C8A96B] hover:text-[#0E1116] transition-all shadow-[0_0_10px_rgba(200,169,107,0.2)]"
                  title="Lewati Waktu (Fast Forward)"
                >
                  <FastForward size={14} />
                </button>
                <button 
                  onClick={forceEndGame}
                  className={`h-8 flex items-center justify-center rounded-full transition-all shadow-[0_0_10px_rgba(166,61,64,0.2)] ${
                    confirmEnd 
                      ? "w-auto px-3 gap-1.5 bg-[#A63D40] text-white border border-[#A63D40]" 
                      : "w-8 bg-[#A63D40]/20 text-[#A63D40] border border-[#A63D40]/30 hover:bg-[#A63D40] hover:text-white"
                  }`}
                  title="Hentikan Permainan Paksa"
                >
                  <XOctagon size={14} />
                  {confirmEnd && <span className="text-[10px] font-bold tracking-wider uppercase">Yakin?</span>}
                </button>
              </>
            )}
            {gameState?.timerEnd && (
              <Timer timerEnd={gameState.timerEnd} />
            )}
          </div>
        </motion.div>

      {/* CENTER — Player Grid */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-2">
        {/* Phase instruction */}
        <motion.div
          key={phase}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 text-center"
        >
          {phase === "clue" && (
            <div>
              {isMyTurn ? (
                <div className="space-y-4 flex flex-col items-center mt-2">
                  <p className="text-[#C8A96B] font-display font-bold text-xl animate-pulse tracking-wide">GILIRANMU!</p>
                  <p className="text-[#8A8F98] text-sm tracking-wide">Sebutkan 1 kata petunjuk</p>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-2 px-8 py-5 bg-gradient-to-b from-[#C8A96B]/10 to-[#C8A96B]/5 border border-[#C8A96B]/30 rounded-3xl shadow-[0_8px_30px_rgba(200,169,107,0.2)] inline-block min-w-[220px]"
                  >
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#8A8F98] mb-2">Kata Rahasiamu</p>
                    <p className="font-display text-3xl font-bold gradient-text">{myWord}</p>
                  </motion.div>
                  <Button 
                    onClick={handleNextTurn} 
                    variant="primary" 
                    size="lg" 
                    className="mt-6 w-full max-w-[220px]"
                  >
                    Selesai & Lanjut
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <p className="text-[#F5F5F5] text-sm flex items-center gap-2">
                    Giliran:{" "}
                    <span className="text-[#C8A96B] font-semibold text-lg ml-1">
                      {players.find((p) => p.id === gameState?.clueOrder?.[gameState?.currentClueIndex ?? 0])?.username}
                    </span>
                    {isHost && (
                      <button 
                        onClick={handleNextTurn} 
                        className="p-1 bg-[#A63D40]/20 text-[#A63D40] rounded-full hover:bg-[#A63D40] hover:text-white transition-colors"
                        title="Lewati Pemain (Skip)"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </p>
                  <button
                    onClick={() => setShowWordHint(!showWordHint)}
                    className="mt-2 flex items-center gap-1 text-xs text-[#8A8F98] mx-auto"
                  >
                    {showWordHint ? <EyeOff size={12} /> : <Eye size={12} />}
                    {showWordHint ? "Sembunyikan kata" : "Lihat kata rahasiamu"}
                  </button>
                  {showWordHint && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-1 font-display font-bold gradient-text text-xl"
                    >
                      {myWord}
                    </motion.p>
                  )}
                </div>
              )}
            </div>
          )}
          {phase === "discussion" && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-green-400 font-display font-bold text-lg">Waktu Diskusi</p>
              <p className="text-[#8A8F98] text-sm">Analisis petunjuk dan cari kejanggalan!</p>
              
              {myRole === "impostor" && room?.settings.impostorSabotage && !gameState?.sabotageUsed && me?.isAlive && (
                <Button 
                  onClick={() => setShowSabotageSelect(true)} 
                  size="sm"
                  className="mt-1 bg-[#A63D40]/20 text-[#A63D40] border-[#A63D40]/30 hover:bg-[#A63D40] hover:text-white"
                >
                  <XOctagon size={14} className="mr-1" />
                  Sabotase Warga
                </Button>
              )}

              {myRole === "mr_white" && me?.isAlive && (
                <Button 
                  onClick={() => setShowMrWhiteGuess(true)} 
                  size="sm"
                  className="mt-1 bg-white/10 text-white border-white/20 hover:bg-white hover:text-black"
                >
                  <Eye size={14} className="mr-1" />
                  Tebak Kata Warga
                </Button>
              )}

              {isHost && (
                <Button 
                  onClick={() => advancePhase(roomId, "voting", room!.settings.votingTime)} 
                  variant="secondary" 
                  size="sm"
                  className="mt-2 border-[#C8A96B]/30 text-[#C8A96B] hover:bg-[#C8A96B]/10"
                >
                  Mulai Voting Sekarang
                </Button>
              )}
            </div>
          )}
          {phase === "voting" && (
            <div>
              <p className="text-[#A63D40] font-display font-bold text-lg">Waktu Memilih!</p>
              <p className="text-[#8A8F98] text-sm">Siapa yang mencurigakan?</p>
            </div>
          )}
        </motion.div>

        {/* Players Circle */}
        <div className="relative w-full max-w-[320px] aspect-square mx-auto mt-2 mb-6">
          {alivePlayers.map((player, i) => {
            const total = alivePlayers.length;
            const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
            const radius = 120; // Tighter radius to fit perfectly in 320px
            // Center is exactly 160, 160
            const x = Math.cos(angle) * radius + 160;
            const y = Math.sin(angle) * radius + 160;

            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                style={{ position: "absolute", left: x - 30, top: y - 35 }}
              >
                <PlayerAvatar
                  player={player}
                  isSpeaking={speakingPlayers.has(player.id)}
                  isEliminated={!player.isAlive}
                  isSelected={phase === "voting" && selectedVote === player.id}
                  ghostRoleLabel={me?.isGhost || isAllSeeing ? player.role : undefined}
                  ghostWordLabel={me?.isGhost || isAllSeeing ? player.word : undefined}
                  onClick={
                    phase === "voting" && !hasVoted && player.isAlive && !me?.isGhost
                      ? () => handleVote(player.id)
                      : undefined
                  }
                  size="sm"
                />
              </motion.div>
            );
          })}

          {/* Center decoration */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 rounded-full border border-[#C8A96B]/20 flex items-center justify-center bg-[#171B22]/50 backdrop-blur-md shadow-[0_0_30px_rgba(200,169,107,0.1)]">
              <div className="text-center">
                <span className="block text-[#8A8F98] text-[8px] uppercase tracking-widest">Ronde</span>
                <span className="block font-display text-[#C8A96B] text-xl font-bold">{gameState?.round}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Voting panel */}
        {phase === "voting" && (
          <VotingPanel
            players={alivePlayers}
            myId={profile?.uid || ""}
            hasVoted={hasVoted}
            selectedVote={selectedVote}
            onVote={handleVote}
            isHost={isHost}
            onForceEnd={skipPhase}
            isObserver={!me?.isAlive || me?.isGhost}
          />
        )}
      </div>

        {/* BOTTOM CONTROLS (Floating Dock) */}
        <div className="relative z-10 px-6 pb-16 mt-auto pointer-events-none">
          
          {/* Quick Emote Bar */}
          <div className="flex justify-center gap-6 mb-4 pointer-events-auto">
            {["😂", "😡", "😱", "🤡"].map(emoji => (
              <motion.button
                key={emoji}
                whileTap={{ scale: 0.8 }}
                onClick={() => sendEmote(emoji)}
                className="text-2xl opacity-70 hover:opacity-100 transition-all drop-shadow-md"
              >
                {emoji}
              </motion.button>
            ))}
          </div>

          <div className="glass rounded-full p-2 flex items-center justify-between gap-1 shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-[#C8A96B]/20 pointer-events-auto">
            {/* Notepad Toggle */}
            <motion.button
              onClick={() => setShowNotepad(!showNotepad)}
              whileTap={{ scale: 0.9 }}
              className="relative flex items-center justify-center w-12 h-12 rounded-full transition-colors group"
            >
              <div className={`absolute inset-0 rounded-full transition-colors ${
                showNotepad ? "bg-[#C8A96B]/20" : "bg-transparent group-hover:bg-white/5"
              }`} />
              <PenLine size={20} className={showNotepad ? "text-[#C8A96B]" : "text-[#8A8F98]"} />
            </motion.button>

            {/* Chat Toggle */}
            <motion.button
              onClick={() => setShowChat(!showChat)}
              whileTap={{ scale: 0.9 }}
              className="relative flex items-center justify-center w-12 h-12 rounded-full transition-colors group"
            >
              <div className={`absolute inset-0 rounded-full transition-colors ${
                showChat ? "bg-[#C8A96B]/20" : "bg-transparent group-hover:bg-white/5"
              }`} />
              <MessageCircle size={20} className={showChat ? "text-[#C8A96B]" : "text-[#8A8F98]"} />
              {messages.length > 0 && (
                <span className="absolute 1 top-0 right-0 w-4 h-4 bg-[#C8A96B] rounded-full text-[9px] flex items-center justify-center text-[#0E1116] font-bold border-2 border-[#171B22]">
                  {Math.min(messages.length, 99)}
                </span>
              )}
            </motion.button>

            {/* MIC Button (Prominent Center) */}
            <div className="mx-2">
              <MicButton
                isMuted={isMuted}
                onToggle={toggleMute}
              />
            </div>

            {/* Word peek */}
            <motion.button
              onClick={() => setShowWordHint(!showWordHint)}
              whileTap={{ scale: 0.9 }}
              className="relative flex items-center justify-center w-12 h-12 rounded-full transition-colors group"
            >
              <div className="absolute inset-0 rounded-full bg-transparent group-hover:bg-white/5 transition-colors" />
              {showWordHint ? <EyeOff size={20} className="text-[#C8A96B]" /> : <Eye size={20} className="text-[#8A8F98]" />}
            </motion.button>
          </div>
        </div>

      {/* Notepad Drawer */}
      <AnimatePresence>
        {showNotepad && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotepad(false)}
              className="absolute inset-0 bg-black/50 z-30"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="absolute bottom-0 inset-x-0 h-[60vh] bg-[#171B22] border-t border-[#262B33] rounded-t-3xl z-40 flex flex-col overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#262B33]">
                <h3 className="font-semibold text-sm flex items-center gap-2 text-[#C8A96B]"><PenLine size={16}/> Buku Catatan Pribadi</h3>
                <button onClick={() => setShowNotepad(false)} className="text-[#8A8F98] text-sm hover:text-white transition-colors">
                  Tutup
                </button>
              </div>
              <div className="flex-1 overflow-hidden p-4">
                <textarea
                  value={notepadText}
                  onChange={(e) => setNotepadText(e.target.value)}
                  placeholder="Ketik rahasia dan petunjuk di sini...&#10;Contoh: Si Budi bilang daun. Si Siti bohong."
                  className="w-full h-full bg-[#0E1116] border border-[#262B33] rounded-2xl p-4 text-[#F5F5F5] placeholder-[#8A8F98]/50 focus:outline-none focus:border-[#C8A96B]/50 transition-colors resize-none text-sm leading-relaxed"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Chat Drawer */}
      <AnimatePresence>
        {showChat && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChat(false)}
              className="absolute inset-0 bg-black/50 z-30"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="absolute bottom-0 inset-x-0 h-[70vh] bg-[#171B22] border-t border-[#262B33] rounded-t-3xl z-40 flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#262B33]">
                <h3 className="font-semibold text-sm">Obrolan Ruangan</h3>
                <button onClick={() => setShowChat(false)} className="text-[#8A8F98] text-sm">
                  Tutup
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatPanel 
                  roomId={roomId} 
                  messages={messages} 
                  disabled={isSabotaged || phase === "voting" || phase === "role-reveal" || me?.isGhost} 
                  placeholder={me?.isGhost ? "Ghost tidak bisa chat" : isSabotaged ? "🤫 KAMU TELAH DISABOTASE!" : undefined}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>



      {/* FLOATING EMOTES */}
      <AnimatePresence>
        {flyingEmotes.map(emote => (
          <motion.div
            key={emote.id}
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 1, 0], y: -400, scale: [0.5, 2, 2, 1.5] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.0, ease: "easeOut", times: [0, 0.1, 0.6, 1] }}
            className="fixed bottom-32 z-50 pointer-events-none text-4xl drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
            style={{ left: `${emote.left}vw` }}
          >
            {emote.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* CHAT TOAST OVERLAY */}
      {/* CHAT TOAST OVERLAY */}
      <div className="fixed bottom-40 left-4 z-40 max-w-[60vw] pointer-events-none flex flex-col justify-end gap-2">
        <AnimatePresence>
          {toastMessages.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: -20, scale: 0.9, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, x: 0, scale: 1, height: "auto", marginBottom: 0 }}
              exit={{ opacity: 0, scale: 0.8, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
              className="origin-bottom-left"
            >
              <div className="bg-[#171B22]/90 backdrop-blur-md border border-[#262B33] rounded-2xl p-2 px-3 shadow-2xl flex flex-col gap-0.5 items-start">
                <span className="text-[9px] text-[#C8A96B] font-bold uppercase tracking-wider">{toast.username}</span>
                <p className="text-xs text-white text-left line-clamp-2">{toast.text}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}
