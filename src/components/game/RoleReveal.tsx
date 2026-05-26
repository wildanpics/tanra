"use client";

import { motion } from "framer-motion";
import { Shield, Skull } from "lucide-react";
import { Role } from "@/types";

interface RoleRevealProps {
  role: Role;
  word: string;
  onClose: () => void;
  partnerNames?: string[];
}

export function RoleReveal({ role, word, partnerNames, onClose }: RoleRevealProps) {
  const isImpostor = role === "impostor";
  const isJester = role === "jester";
  const isMrWhite = role === "mr_white";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0E1116] flex flex-col items-center justify-center"
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          background: isImpostor
            ? "radial-gradient(circle at center, rgba(166,61,64,0.15) 0%, transparent 70%)"
            : isJester
            ? "radial-gradient(circle at center, rgba(168,85,247,0.15) 0%, transparent 70%)"
            : "radial-gradient(circle at center, rgba(200,169,107,0.1) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 text-center px-8 max-w-sm w-full">
        {/* Role Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
          className="mb-8 flex justify-center"
        >
          <div
            className={`w-28 h-28 rounded-full flex items-center justify-center border-2 ${
              isImpostor
                ? "bg-[#A63D40]/20 border-[#A63D40] shadow-[0_0_40px_rgba(166,61,64,0.4)]"
                : isJester
                ? "bg-purple-900/40 border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.4)]"
                : "bg-[#C8A96B]/10 border-[#C8A96B] shadow-[0_0_40px_rgba(200,169,107,0.3)]"
            }`}
          >
            {isImpostor ? (
              <Skull size={52} className="text-[#A63D40]" />
            ) : isJester ? (
              <Skull size={52} className="text-purple-400" />
            ) : (
              <Shield size={52} className="text-[#C8A96B]" />
            )}
          </div>
        </motion.div>

        {/* Role Label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-[#8A8F98] text-xs tracking-widest uppercase mb-2">Peranmu adalah</p>
          <h2
            className={`font-display text-5xl font-black mb-6 ${
              isImpostor ? "text-[#A63D40]" : isJester ? "text-purple-400" : "gradient-text"
            }`}
          >
            {isImpostor ? "PENIPU" : isJester ? "JESTER" : isMrWhite ? "SI KOSONG" : "WARGA"}
          </h2>
        </motion.div>

        {/* Word */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className={`p-5 rounded-2xl border mb-8 ${
            isImpostor
              ? "bg-[#A63D40]/10 border-[#A63D40]/30"
              : isJester
              ? "bg-purple-900/20 border-purple-500/30"
              : "bg-[#C8A96B]/5 border-[#C8A96B]/20"
          }`}
        >
          <p className="text-[#8A8F98] text-xs mb-2">Kata rahasiamu</p>
          <p
            className={`font-display text-3xl font-bold ${
              isImpostor ? "text-[#A63D40]" : isJester ? "text-purple-400" : "gradient-text"
            }`}
          >
            {word || "???"}
          </p>
          {isImpostor && (
            <p className="text-[#8A8F98] text-xs mt-2">
              Pura-pura tahu kata warga yang sebenarnya!
            </p>
          )}
          {isJester && (
            <p className="text-purple-300 text-xs mt-2 font-bold">
              Tipu warga seolah kamu penipu agar kamu yang dieksekusi!
            </p>
          )}
          {isImpostor && partnerNames && partnerNames.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-[#A63D40]/20 border border-[#A63D40]/30">
              <p className="text-[#8A8F98] text-[10px] uppercase mb-1">Rekan Penipu Anda:</p>
              <p className="text-white font-bold text-sm">
                {partnerNames.join(", ")}
              </p>
            </div>
          )}
        </motion.div>

        {/* Role description */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mb-8"
        >
          <p className="text-[#8A8F98] text-sm leading-relaxed">
            {isImpostor
              ? "Kamu adalah penipu! Coba blend in dan hindari kecurigaan. Temukan kata warga yang sebenarnya."
              : isJester
              ? "Kamu adalah Si Badut (Jester). Tujuanmu hanyalah satu: Buat dirimu dicurigai dan mati dieksekusi saat fase Voting!"
              : isMrWhite
              ? "Kamu adalah Si Kosong! Kamu tidak memiliki kata rahasia. Tebak apa kata rahasia warga dan menangkan permainan!"
              : "Kamu adalah warga! Berikan petunjuk tanpa mengungkap kata secara langsung. Temukan si penipu!"}
          </p>
        </motion.div>

        {/* Dismiss */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <motion.button
            onClick={onClose}
            whileTap={{ scale: 0.95 }}
            className={`w-full py-4 rounded-2xl font-semibold text-sm ${
              isImpostor
                ? "bg-[#A63D40] text-white"
                : isJester
                ? "bg-purple-600 text-white"
                : "bg-gradient-to-r from-[#C8A96B] to-[#A08552] text-[#0E1116]"
            }`}
          >
            Mengerti, Mulai!
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
