"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/features/auth/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function LoginPage() {
  const { signInWithGoogle, loading: authLoading } = useAuth();
  const { ready } = useAuthGuard({ requireAuth: false, redirectTo: "/home" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch {
      setError("Gagal masuk. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || !ready) {
    return (
      <div style={{ minHeight: "100dvh", backgroundColor: "#0E1116", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #C8A96B", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#0E1116", position: "relative", overflow: "hidden" }}>

      {/* Batik texture overlay */}
      <div className="absolute inset-0 batik-overlay" style={{ opacity: 0.5, pointerEvents: "none" }} />

      {/* Ambient center glow */}
      <div style={{
        position: "absolute",
        top: "30%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 600,
        height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(200,169,107,0.08) 0%, transparent 70%)",
        filter: "blur(40px)",
        pointerEvents: "none",
      }} />

      {/* Bottom gradient fade */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "50%",
        background: "linear-gradient(to top, rgba(8,10,14,0.95), transparent)",
        pointerEvents: "none",
      }} />

      {/* Floating dust */}
      {[...Array(10)].map((_, i) => (
        <motion.div key={i}
          style={{
            position: "absolute",
            borderRadius: "50%",
            backgroundColor: "#C8A96B",
            width: i % 3 === 0 ? 3 : 2,
            height: i % 3 === 0 ? 3 : 2,
            left: `${8 + (i * 9) % 84}%`,
            top: `${20 + (i * 7) % 55}%`,
            pointerEvents: "none",
          }}
          animate={{ y: [0, -28, 0], opacity: [0, 0.6, 0] }}
          transition={{ duration: 4 + i * 0.6, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
        />
      ))}

      {/* ── LOGO — centered in upper 58% of screen ── */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "58%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
      }}>
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          style={{ textAlign: "center" }}
        >
          {/* Ornament */}
          <motion.div
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 14 }}
          >
            <div style={{ height: 1, width: 48, background: "linear-gradient(to right, transparent, rgba(200,169,107,0.7))" }} />
            <span className="font-display" style={{ color: "#C8A96B", fontSize: 10, letterSpacing: "0.45em", textTransform: "uppercase" }}>Nusantara</span>
            <div style={{ height: 1, width: 48, background: "linear-gradient(to left, transparent, rgba(200,169,107,0.7))" }} />
          </motion.div>

          {/* Title */}
          <motion.h1
            className="font-display font-black gradient-text"
            animate={{ opacity: [0.9, 1, 0.9] }}
            transition={{ duration: 5, repeat: Infinity }}
            style={{ fontSize: "clamp(4.5rem, 15vw, 9rem)", lineHeight: 1, margin: 0 }}
          >
            TANRA
          </motion.h1>

          {/* Subtitle */}
          <p className="font-sans" style={{
            color: "#8A8F98",
            fontSize: "clamp(0.55rem, 1.5vw, 0.72rem)",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            fontWeight: 300,
            marginTop: 16,
          }}>
            Permainan Deduksi Sosial
          </p>

          {/* Separator dots */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16 }}>
            <div style={{ height: 1, width: 28, background: "#262B33" }} />
            <div style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(200,169,107,0.4)" }} />
            <div style={{ height: 1, width: 28, background: "#262B33" }} />
          </div>
        </motion.div>
      </div>

      {/* ── SIGN-IN CARD — anchored to bottom, starts ~45% ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, delay: 0.35, ease: "easeOut" }}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "0 20px 24px",
        }}
      >
        {/* Card container */}
        <div style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 24,
          padding: "24px 24px 22px",
          background: "linear-gradient(145deg, #232a35 0%, #1a1f28 40%, #161b22 100%)",
          border: "1px solid rgba(200,169,107,0.15)",
          boxShadow: [
            "0 0 0 1px rgba(255,255,255,0.05)",
            "0 -4px 40px rgba(200,169,107,0.06)",
            "0 30px 80px rgba(0,0,0,0.7)",
          ].join(", "),
        }}>

          {/* Card header text */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <p className="font-sans" style={{ color: "#F5F5F5", fontSize: 17, fontWeight: 600, marginBottom: 6 }}>
              Selamat datang
            </p>
            <p className="font-sans" style={{ color: "#8A8F98", fontSize: 13, lineHeight: 1.6 }}>
              Masuk untuk mulai bermain bersama teman
            </p>
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(38,43,51,0.8)" }} />
            <span className="font-sans" style={{ color: "rgba(138,143,152,0.45)", fontSize: 10, letterSpacing: "0.12em" }}>LANJUTKAN DENGAN</span>
            <div style={{ flex: 1, height: 1, background: "rgba(38,43,51,0.8)" }} />
          </div>

          {/* Google button — glassmorphism */}
          <motion.button
            onClick={handleGoogleSignIn}
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -2 }}
            whileTap={{ scale: loading ? 1 : 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              borderRadius: 16,
              border: "1px solid rgba(200,169,107,0.25)",
              cursor: loading ? "not-allowed" : "pointer",
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              opacity: loading ? 0.55 : 1,
              boxShadow: "0 4px 24px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.07) inset",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Shimmer */}
            {!loading && (
              <motion.div
                style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(90deg, transparent 0%, rgba(200,169,107,0.12) 50%, transparent 100%)",
                  transform: "translateX(-100%)",
                }}
                whileHover={{ transform: "translateX(100%)" }}
                transition={{ duration: 0.6 }}
              />
            )}

            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  style={{ width: 22, height: 22, borderRadius: "50%", border: "2.5px solid rgba(138,143,152,0.3)", borderTopColor: "#C8A96B", flexShrink: 0 }}
                />
                <span className="font-sans" style={{ flex: 1, textAlign: "center", color: "#8A8F98", fontSize: 15, fontWeight: 500 }}>Sedang masuk...</span>
              </>
            ) : (
              <>
                {/* Google logo — transparan dengan border */}
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>

                <span className="font-sans" style={{ flex: 1, textAlign: "center", color: "#F5F5F5", fontSize: 15, fontWeight: 500 }}>
                  Masuk dengan Google
                </span>

                {/* Arrow */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: "rgba(200,169,107,0.7)" }}>
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </motion.button>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                style={{ overflow: "hidden" }}
              >
                <p className="font-sans" style={{
                  textAlign: "center", color: "#c0464a", fontSize: 12,
                  background: "rgba(166,61,64,0.1)",
                  border: "1px solid rgba(166,61,64,0.25)",
                  borderRadius: 12, padding: "10px 14px",
                }}>
                  ⚠ {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Terms */}
          <p className="font-sans" style={{
            textAlign: "center",
            color: "rgba(138,143,152,0.5)",
            fontSize: 11.5,
            lineHeight: 1.6,
            marginTop: 20,
          }}>
            Dengan masuk, kamu menyetujui{" "}
            <span style={{ color: "rgba(200,169,107,0.65)" }}>persyaratan permainan</span>
          </p>
        </div>

        {/* Version */}
        <p className="font-sans" style={{ color: "rgba(138,143,152,0.2)", fontSize: 11, letterSpacing: "0.25em", marginTop: 16 }}>
          v0.1.0 · Beta
        </p>
      </motion.div>
    </div>
  );
}
