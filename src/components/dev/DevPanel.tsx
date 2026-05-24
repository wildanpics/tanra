"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Eye, ShieldAlert, X, EyeOff } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { AdminModal } from "./AdminModal";

export function DevPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // Sembunyikan tombol secara default
  const [forceRole, setForceRole] = useState<string | null>(null);
  const pathname = usePathname();
  const { profile } = useAuth();

  useEffect(() => {
    setForceRole(localStorage.getItem("TANRA_FORCE_ROLE"));
    const handleToggle = () => setIsVisible((v) => !v);
    window.addEventListener("tanra-toggle-dev-btn", handleToggle);
    return () => window.removeEventListener("tanra-toggle-dev-btn", handleToggle);
  }, []);

  const isDev = profile?.email === "mwildanfiqri88@gmail.com";

  if (!isDev || !profile || !isVisible) return null;

  return (
    <>
      <motion.div 
        drag 
        dragMomentum={false}
        className="fixed top-4 right-4 z-[9998] touch-none"
      >
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-10 h-10 rounded-full bg-[#171B22] border-2 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] flex items-center justify-center text-green-500 relative"
      >
        <Terminal size={18} />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10, transformOrigin: "top right" }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="absolute top-12 right-0 w-64 bg-[#171B22]/95 backdrop-blur-md border border-green-500/30 rounded-2xl p-4 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-green-400 text-sm flex items-center gap-2">
                  <ShieldAlert size={14} /> DEV MODE
                </h3>
                <p className="text-[10px] text-[#8A8F98]">UID: {profile.uid.substring(0, 8)}...</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-[#8A8F98] hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowAdminModal(true);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 p-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 transition-colors text-sm font-medium"
              >
                <Terminal size={14} />
                Pusat Komando
              </button>
              
              {pathname.startsWith("/room/") && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl mt-3">
                  <p className="text-red-400 text-[10px] font-bold uppercase mb-2">Cheat Takdir (Host Only)</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        const newState = forceRole === "impostor" ? null : "impostor";
                        if (newState) {
                          localStorage.setItem("TANRA_FORCE_ROLE", newState);
                          alert("Berhasil! Anda pasti akan jadi Impostor ronde ini.");
                        } else {
                          localStorage.removeItem("TANRA_FORCE_ROLE");
                        }
                        setForceRole(newState);
                      }}
                      className={`flex-1 text-white text-[10px] py-1.5 rounded transition-colors ${
                        forceRole === "impostor" ? "bg-red-500 border border-red-400 font-bold" : "bg-red-500/20 hover:bg-red-500/50"
                      }`}
                    >
                      Jadi Impostor
                    </button>
                    <button 
                      onClick={() => {
                        const newState = forceRole === "civilian" ? null : "civilian";
                        if (newState) {
                          localStorage.setItem("TANRA_FORCE_ROLE", newState);
                          alert("Berhasil! Anda pasti akan jadi Warga ronde ini.");
                        } else {
                          localStorage.removeItem("TANRA_FORCE_ROLE");
                        }
                        setForceRole(newState);
                      }}
                      className={`flex-1 text-white text-[10px] py-1.5 rounded transition-colors ${
                        forceRole === "civilian" ? "bg-blue-500 border border-blue-400 font-bold" : "bg-blue-500/20 hover:bg-blue-500/50"
                      }`}
                    >
                      Jadi Warga
                    </button>
                  </div>
                </div>
              )}

              {/* Toggle Invisible Spectator Mode globally */}
              <div className="mt-3 border-t border-[#262B33] pt-3">
                <p className="text-[#8A8F98] text-[10px] uppercase mb-2">Spectator Rahasia</p>
                <button
                  onClick={() => {
                    const current = localStorage.getItem("TANRA_GHOST_MODE") === "true";
                    localStorage.setItem("TANRA_GHOST_MODE", (!current).toString());
                    window.dispatchEvent(new CustomEvent("tanra-ghost-toggled"));
                    // Reload to apply
                    window.location.reload();
                  }}
                  className={`w-full py-2 rounded-xl text-xs font-bold border transition-all flex justify-center items-center gap-2 ${
                    localStorage.getItem("TANRA_GHOST_MODE") === "true"
                      ? "bg-purple-500/20 text-purple-400 border-purple-500/50"
                      : "bg-[#0E1116] text-[#8A8F98] border-[#262B33]"
                  }`}
                >
                  <Eye size={14} />
                  {localStorage.getItem("TANRA_GHOST_MODE") === "true" ? "Ghost Mode: ON" : "Ghost Mode: OFF"}
                </button>
                <p className="text-[9px] text-[#8A8F98] mt-1 text-center leading-tight">
                  Jika ON, Anda bisa Join Room tanpa terdeteksi di lobby & melihat segalanya.
                </p>

                {/* All-Seeing Eye Toggle */}
                {pathname.startsWith("/game/") && (
                  <button
                    onClick={() => {
                      const current = localStorage.getItem("TANRA_ALL_SEEING") === "true";
                      localStorage.setItem("TANRA_ALL_SEEING", (!current).toString());
                      window.dispatchEvent(new CustomEvent("tanra-all-seeing-toggled"));
                      window.location.reload();
                    }}
                    className={`w-full mt-2 py-2 rounded-xl text-xs font-bold border transition-all flex justify-center items-center gap-2 ${
                      localStorage.getItem("TANRA_ALL_SEEING") === "true"
                        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                        : "bg-[#0E1116] text-[#8A8F98] border-[#262B33]"
                    }`}
                  >
                    <Eye size={14} />
                    {localStorage.getItem("TANRA_ALL_SEEING") === "true" ? "Mata Dewa: ON" : "Mata Dewa: OFF"}
                  </button>
                )}
              </div>

              {/* Hide Panel Button */}
              <button
                onClick={() => {
                  setIsVisible(false);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 mt-4 p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors text-xs font-bold"
              >
                <EyeOff size={14} />
                Sembunyikan Panel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>

    <AnimatePresence>
      {showAdminModal && <AdminModal onClose={() => setShowAdminModal(false)} />}
    </AnimatePresence>
    </>
  );
}
