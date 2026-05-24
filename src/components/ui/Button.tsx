"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
  icon?: ReactNode;
}

const variants = {
  primary:
    "bg-gradient-to-r from-[#C8A96B] to-[#A08552] text-[#0E1116] font-bold hover:from-[#D4B87A] hover:to-[#B09462] shadow-[0_4px_20px_rgba(200,169,107,0.3)] border border-[#D4B87A]/30",
  secondary:
    "border border-[#262B33] bg-[#171B22]/80 backdrop-blur-sm text-[#F5F5F5] font-semibold hover:border-[#C8A96B]/50 hover:bg-[#1E2430] hover:text-[#C8A96B] shadow-[0_4px_15px_rgba(0,0,0,0.2)]",
  danger:
    "bg-gradient-to-r from-[#A63D40] to-[#8B3033] text-white font-bold hover:from-[#B84245] hover:to-[#9A3538] shadow-[0_4px_20px_rgba(166,61,64,0.3)] border border-[#B84245]/30",
  ghost:
    "text-[#8A8F98] font-medium hover:text-[#C8A96B] hover:bg-[#C8A96B]/10",
};

const sizes = {
  sm: "px-4 py-2 text-xs rounded-xl tracking-wide",
  md: "px-6 py-3 text-sm rounded-2xl tracking-wide",
  lg: "px-8 py-3.5 text-base rounded-2xl tracking-wide",
  xl: "px-10 py-4 text-lg rounded-3xl tracking-wide",
};

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  className,
  type = "button",
  fullWidth = false,
  icon,
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          />
          <span>Memuat...</span>
        </div>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
}
