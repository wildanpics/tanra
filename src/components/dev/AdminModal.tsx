"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { collection, query, onSnapshot, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Room } from "@/types";
import { Terminal, Trash2, ShieldAlert, Users, Activity, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface AdminModalProps {
  onClose: () => void;
}

export function AdminModal({ onClose }: AdminModalProps) {
  const { profile } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    if (!profile || profile.email !== "mwildanfiqri88@gmail.com") return;

    // Listen to active rooms
    const q = query(collection(db, "rooms"));
    const unsub = onSnapshot(q, (snap) => {
      const activeRooms: Room[] = [];
      snap.forEach((d) => {
        const data = d.data() as Room;
        if (data.status !== "deleted" as any) {
          activeRooms.push({ ...data, id: d.id });
        }
      });
      // Sort by newest
      activeRooms.sort((a, b) => b.createdAt - a.createdAt);
      setRooms(activeRooms);
    });

    // Get total users (basic count)
    getDocs(collection(db, "users")).then(snap => {
      setTotalUsers(snap.size);
    });

    return () => unsub();
  }, [profile]);

  async function handleDeleteRoom(roomId: string) {
    try {
      await deleteDoc(doc(db, "rooms", roomId));
      alert("Ruangan berhasil dihapus permanen dari database!");
    } catch (err: any) {
      alert(`Hard delete gagal: ${err.message}\n\nSistem akan mencoba Soft Delete...`);
      try {
        await updateDoc(doc(db, "rooms", roomId), {
          status: "deleted"
        });
        alert("Ruangan berhasil disembunyikan (Soft Delete)!");
      } catch (updateErr: any) {
        alert(`Semua cara gagal. Error: ${updateErr.message}`);
      }
    }
  }

  if (!profile || profile.email !== "mwildanfiqri88@gmail.com") {
    return null;
  }

  const activePlayersCount = rooms.reduce((acc, room) => acc + Object.keys(room.players || {}).length, 0);
  const playingRooms = rooms.filter(r => r.status === "playing");

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm touch-none">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-4xl max-h-[90dvh] bg-[#0E1116] border border-[#262B33] rounded-3xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto touch-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#262B33] bg-[#171B22]/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-green-500 border border-green-500/30">
              <Terminal size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-green-400 tracking-wider">PUSAT KOMANDO TANRA</h1>
              <p className="text-[#8A8F98] text-xs sm:text-sm">Email: {profile.email}</p>
              <p className="text-[#8A8F98] text-[10px] font-mono mt-0.5">UID: {profile.uid}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#262B33] text-[#8A8F98] hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#171B22] p-5 rounded-2xl border border-[#262B33]">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[#8A8F98] font-medium text-sm">Ruang Aktif</p>
                <Activity className="text-blue-400" size={18} />
              </div>
              <p className="text-3xl font-bold font-display text-white">{rooms.length}</p>
              <p className="text-xs text-[#8A8F98] mt-2">{playingRooms.length} sedang bermain</p>
            </div>

            <div className="bg-[#171B22] p-5 rounded-2xl border border-[#262B33]">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[#8A8F98] font-medium text-sm">Pemain Online</p>
                <Users className="text-green-400" size={18} />
              </div>
              <p className="text-3xl font-bold font-display text-white">{activePlayersCount}</p>
            </div>

            <div className="bg-[#171B22] p-5 rounded-2xl border border-[#262B33]">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[#8A8F98] font-medium text-sm">Akun Terdaftar</p>
                <ShieldAlert className="text-[#C8A96B]" size={18} />
              </div>
              <p className="text-3xl font-bold font-display text-white">{totalUsers}</p>
            </div>
          </div>

          {/* Rooms List */}
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
            <Activity size={18} className="text-[#C8A96B]" /> Daftar Ruangan Server
          </h2>
          
          <div className="bg-[#171B22] rounded-2xl border border-[#262B33] overflow-hidden">
            {rooms.length === 0 ? (
              <div className="p-8 text-center text-[#8A8F98]">Tidak ada ruangan yang aktif saat ini.</div>
            ) : (
              <div className="divide-y divide-[#262B33]">
                {rooms.map((room) => (
                  <div key={room.id} className="p-4 hover:bg-[#262B33]/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-lg text-[#C8A96B]">{room.code}</h3>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          room.status === "playing" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                          room.status === "waiting" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                          "bg-[#262B33] text-[#8A8F98]"
                        }`}>
                          {room.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#8A8F98]">
                        Dibuat {formatDistanceToNow(room.createdAt, { addSuffix: true, locale: id })} • {Object.keys(room.players || {}).length} Pemain
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <button
                        onClick={() => {
                          localStorage.setItem("TANRA_GHOST_MODE", "true");
                          router.push(`/room/${room.id}`);
                          onClose();
                        }}
                        className="px-4 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold transition-colors"
                      >
                        Intip (Ghost)
                      </button>
                      
                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        className="w-10 h-10 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center border border-red-500/30 transition-colors"
                        title="Tutup Paksa Ruangan"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
