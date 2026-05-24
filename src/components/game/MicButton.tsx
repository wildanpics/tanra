"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface MicButtonProps {
  isMuted: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
}

export function MicButton({ isMuted, onToggle, disabled, className }: MicButtonProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Pulse ring when speaking */}
      <AnimatePresence>
        {!isMuted && !disabled && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 1 }}
              animate={{ opacity: [0.4, 0], scale: [1, 1.8] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-[#C8A96B]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 1 }}
              animate={{ opacity: [0.3, 0], scale: [1, 2.2] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              className="absolute inset-0 rounded-full bg-[#C8A96B]"
            />
          </>
        )}
      </AnimatePresence>

      <motion.button
        onClick={onToggle}
        disabled={disabled}
        whileTap={{ scale: 0.9 }}
        className={cn(
          "relative w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl transition-all",
          isMuted
            ? "bg-[#262B33] border-2 border-[#262B33]"
            : "bg-gradient-to-br from-[#C8A96B] to-[#A08552] border-2 border-[#C8A96B] shadow-[0_0_25px_rgba(200,169,107,0.5)]",
          disabled && "opacity-40 cursor-not-allowed"
        )}
        aria-label={isMuted ? "Nyalakan Mikrofon" : "Matikan Mikrofon"}
      >
        {isMuted ? (
          <MicOff size={24} className="text-[#8A8F98]" />
        ) : (
          <Mic size={24} className="text-[#0E1116]" />
        )}
      </motion.button>
    </div>
  );
}
