"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
  hover?: boolean;
}

export function GlassCard({
  children,
  className,
  glow = false,
  onClick,
  hover = false,
}: GlassCardProps) {
  return (
    <motion.div
      onClick={onClick}
      className={cn(
        "relative rounded-2xl border border-[#262B33] bg-[#171B22] p-4",
        glow && "shadow-[0_0_30px_rgba(200,169,107,0.08)]",
        hover && "cursor-pointer",
        className
      )}
      whileHover={hover ? { scale: 1.01, y: -2 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {glow && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#C8A96B]/5 to-transparent pointer-events-none" />
      )}
      {children}
    </motion.div>
  );
}
