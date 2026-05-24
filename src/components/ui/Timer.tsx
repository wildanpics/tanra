"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { calculateTimeLeft, formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TimerProps {
  timerEnd: number | undefined;
  className?: string;
  urgent?: boolean;
}

export function Timer({ timerEnd, className, urgent = false }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!timerEnd) return;

    const update = () => setTimeLeft(calculateTimeLeft(timerEnd));
    update();

    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  }, [timerEnd]);

  const isUrgent = urgent || timeLeft <= 10;
  const progress = timerEnd
    ? Math.max(0, (timerEnd - Date.now()) / (timerEnd - Date.now() + timeLeft * 1000))
    : 0;

  return (
    <motion.div
      className={cn("flex items-center gap-2", className)}
      animate={isUrgent && timeLeft > 0 ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0 }}
    >
      <span
        className={cn(
          "font-mono font-bold text-2xl tabular-nums transition-colors",
          isUrgent && timeLeft > 0 ? "text-[#A63D40]" : "text-[#C8A96B]"
        )}
      >
        {formatTime(timeLeft)}
      </span>
    </motion.div>
  );
}
