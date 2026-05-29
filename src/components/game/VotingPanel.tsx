"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Player } from "@/types";
import { Check } from "lucide-react";

interface VotingPanelProps {
  players: Player[];
  myId: string;
  hasVoted: boolean;
  selectedVote: string | null;
  onVote: (targetId: string) => void;
  isHost?: boolean;
  onForceEnd?: () => void;
  isObserver?: boolean;
}

export const VotingPanel = memo(function VotingPanel({ players, myId, hasVoted, selectedVote, onVote, isHost, onForceEnd, isObserver }: VotingPanelProps) {
  const votablePlayers = players.filter((p) => p.isAlive);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-xs mx-auto mt-6 bg-[#171B22]/80 backdrop-blur-md p-5 rounded-3xl border border-[#262B33] shadow-2xl relative z-20"
    >
      <div className="text-center mb-4">
        <h3 className="font-display text-[#C8A96B] font-bold text-lg">Pilih Pemain</h3>
        <p className="text-[#8A8F98] text-[10px] uppercase tracking-wider mt-1">
          {isObserver ? "Kamu sedang menyimak" : hasVoted ? "Suaramu telah diberikan" : "Ketuk pemain yang mencurigakan"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {votablePlayers.map((player) => {
          const isSelected = selectedVote === player.id;
          const voters = players.filter(p => p.votedFor === player.id);
          return (
            <motion.button
              key={player.id}
              onClick={() => !hasVoted && !isObserver && onVote(player.id)}
              disabled={hasVoted || isObserver}
              whileTap={{ scale: hasVoted || isObserver ? 1 : 0.95 }}
              className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                isSelected
                  ? "bg-[#A63D40]/20 border-[#A63D40] shadow-[0_0_15px_rgba(166,61,64,0.3)]"
                  : (hasVoted || isObserver)
                  ? "bg-[#0E1116] border-[#262B33] opacity-70 grayscale-[50%]"
                  : "bg-[#0E1116] border-[#262B33] hover:border-[#A63D40]/50"
              }`}
            >
              <img
                src={player.avatar}
                alt={player.username}
                className="w-10 h-10 rounded-full border-2 border-[#262B33] object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${player.username}`;
                }}
              />
              <span className={`text-sm font-semibold w-full text-center truncate ${isSelected ? "text-[#F5F5F5]" : "text-[#8A8F98]"}`}>
                {player.username}
              </span>
              
              {voters.length > 0 && (
                <div className="flex -space-x-1.5 mt-0.5 justify-center w-full min-h-[20px]">
                  {voters.map((voter, i) => (
                    <motion.img
                      key={voter.id}
                      initial={{ scale: 0, x: -10 }}
                      animate={{ scale: 1, x: 0 }}
                      src={voter.avatar}
                      alt={voter.username}
                      className="w-5 h-5 rounded-full border border-[#171B22] object-cover shadow-sm"
                      style={{ zIndex: voters.length - i }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${voter.username}`;
                      }}
                    />
                  ))}
                </div>
              )}
              
              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-gradient-to-br from-[#A63D40] to-[#8B3033] rounded-full flex items-center justify-center border-2 border-[#171B22] shadow-[0_0_10px_rgba(166,61,64,0.5)]">
                  <Check size={14} className="text-white" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {(hasVoted || isObserver) && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-[#C8A96B] text-[10px] uppercase tracking-widest mt-4 flex items-center justify-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-[#C8A96B] animate-pulse" />
          Menunggu pemain lain...
        </motion.p>
      )}

      {isHost && onForceEnd && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onForceEnd}
          whileTap={{ scale: 0.95 }}
          className="mt-4 w-full py-2.5 bg-[#A63D40]/20 text-[#A63D40] font-semibold text-xs rounded-xl border border-[#A63D40]/30 hover:bg-[#A63D40] hover:text-white transition-all shadow-md"
        >
          Akhiri Waktu & Proses
        </motion.button>
      )}
    </motion.div>
  );
});
