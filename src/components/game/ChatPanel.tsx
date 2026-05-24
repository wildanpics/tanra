"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";
import { Message } from "@/types";
import { sendMessage } from "@/features/room/useRoom";
import { useAuth } from "@/features/auth/AuthContext";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  roomId: string;
  messages: Message[];
  disabled?: boolean;
  placeholder?: string;
}

export function ChatPanel({ roomId, messages, disabled, placeholder }: ChatPanelProps) {
  const { profile } = useAuth();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || !profile || sending || disabled) return;
    const text = input.trim();
    setInput("");
    setSending(true);

    try {
      await sendMessage(roomId, {
        playerId: profile.uid,
        username: profile.username,
        avatar: profile.avatar,
        text,
        timestamp: Date.now(),
        type: "chat",
      });
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 p-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#262B33]">
        <AnimatePresence initial={false}>
          {messages.filter(m => m.type !== "emote").map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex gap-2 items-start",
                msg.type === "system" && "justify-center"
              )}
            >
              {msg.type === "system" ? (
                <span className="text-xs text-[#8A8F98] italic bg-[#171B22] px-3 py-1 rounded-full border border-[#262B33]">
                  {msg.text}
                </span>
              ) : (
                <>
                  <img
                    src={msg.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${msg.username}`}
                    alt={msg.username}
                    className="w-6 h-6 rounded-full flex-shrink-0 border border-[#262B33]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${msg.username}`;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-[#C8A96B] font-medium">
                      {msg.username}
                    </span>
                    <p className="text-sm text-[#F5F5F5] break-words">{msg.text}</p>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#262B33] p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder || (disabled ? "Chat tidak tersedia" : "Tulis pesan...")}
          maxLength={200}
          className="flex-1 bg-[#0E1116] border border-[#262B33] rounded-xl px-3 py-2 text-sm text-[#F5F5F5] placeholder-[#8A8F98] outline-none focus:border-[#C8A96B]/50 transition-colors disabled:opacity-50"
        />
        <motion.button
          onClick={handleSend}
          disabled={!input.trim() || disabled || sending}
          whileTap={{ scale: 0.9 }}
          className="w-9 h-9 bg-[#C8A96B] rounded-xl flex items-center justify-center text-[#0E1116] disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Send size={15} />
        </motion.button>
      </div>
    </div>
  );
}
