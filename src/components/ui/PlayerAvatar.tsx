"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Player } from "@/types";
import { cn } from "@/lib/utils";
import { Crown } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/features/auth/AuthContext";

interface PlayerAvatarProps {
  player: Player;
  size?: "sm" | "md" | "lg" | "xl";
  isSpeaking?: boolean;
  isEliminated?: boolean;
  showName?: boolean;
  onClick?: () => void;
  isSelected?: boolean;
  isHighlighted?: boolean;
  ghostRoleLabel?: string;
  ghostWordLabel?: string;
}

const sizes = {
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-18 h-18",
  xl: "w-24 h-24",
};

export function PlayerAvatar({
  player,
  size = "md",
  isSpeaking = false,
  isEliminated = false,
  showName = true,
  onClick,
  isSelected = false,
  isHighlighted = false,
  ghostRoleLabel,
  ghostWordLabel,
}: PlayerAvatarProps) {
  const { profile } = useAuth();
  
  return (
    <motion.div
      className={cn("flex flex-col items-center gap-1.5", onClick && "cursor-pointer")}
      onClick={(e) => {
        if (onClick) onClick();
        if (player.id === profile?.uid) {
          window.dispatchEvent(new CustomEvent("tanra-toggle-dev-btn"));
        }
      }}
      whileHover={onClick ? { scale: 1.05 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
    >
      <div className="relative">
        {/* Speaking glow ring */}
        <AnimatePresence>
          {isSpeaking && !isEliminated && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={cn(
                "absolute inset-0 rounded-full",
                sizes[size]
              )}
              style={{
                boxShadow: "0 0 20px rgba(200,169,107,0.8), 0 0 40px rgba(200,169,107,0.4)",
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-full h-full rounded-full border-2 border-[#C8A96B]"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected/highlighted border */}
        {isSelected && (
          <div
            className={cn(
              "absolute -inset-0.5 rounded-full border-2 border-[#A63D40]",
              sizes[size]
            )}
            style={{ boxShadow: "0 0 15px rgba(166,61,64,0.5)" }}
          />
        )}

        {/* Avatar image */}
        <div
          className={cn(
            "relative rounded-full overflow-hidden border-2 transition-all",
            sizes[size],
            isEliminated
              ? "border-[#262B33] opacity-40 grayscale"
              : isSelected
              ? "border-[#A63D40]"
              : isSpeaking
              ? "border-[#C8A96B]"
              : "border-[#262B33]"
          )}
        >
          <img
            src={player.avatar}
            alt={player.username}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${player.username}&backgroundColor=171B22&textColor=C8A96B`;
            }}
          />
        </div>

        {/* Host crown */}
        {player.isHost && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-[#171B22] rounded-full p-0.5 border border-[#C8A96B] shadow-[0_0_10px_rgba(200,169,107,0.3)]">
              <Crown size={12} className="text-[#C8A96B]" strokeWidth={2.5} />
            </div>
          </div>
        )}

        {/* Eliminated X */}
        {isEliminated && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[#A63D40] text-xl font-bold">✕</span>
          </div>
        )}

        {/* Speaking indicator dot */}
        {isSpeaking && !isEliminated && (
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="absolute bottom-0 right-0 w-3 h-3 bg-[#C8A96B] rounded-full border-2 border-[#0E1116]"
          />
        )}
      </div>

      {showName && (
        <div className="flex flex-col items-center">
          <span
            className={cn(
              "text-[11px] font-semibold tracking-wide text-center max-w-[72px] truncate transition-colors",
              isEliminated ? "text-[#8A8F98] line-through opacity-70" : "text-[#F5F5F5]"
            )}
          >
            {player.username}
          </span>
          {ghostRoleLabel && (
            <span className={cn(
              "text-[9px] font-bold uppercase mt-0.5",
              ghostRoleLabel === "impostor" ? "text-red-500" : ghostRoleLabel === "mr_white" ? "text-white" : "text-green-400"
            )}>
              {ghostRoleLabel}
            </span>
          )}
          {ghostWordLabel && (
            <span className="text-[9px] text-[#8A8F98] truncate max-w-[60px]">{ghostWordLabel}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
