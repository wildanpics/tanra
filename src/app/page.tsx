"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { motion } from "framer-motion";

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.push("/home");
    } else {
      router.push("/login");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-dvh bg-[#0E1116] flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-2 border-[#C8A96B] border-t-transparent rounded-full"
      />
    </div>
  );
}
