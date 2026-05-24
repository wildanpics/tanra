"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { collection, query, onSnapshot, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Room } from "@/types";
import { Terminal, Trash2, ShieldAlert, Users, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

export default function AdminDashboard() {
  const { profile } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);

  // Security Check
  useEffect(() => {
    if (profile && profile.email !== "mwildanfiqri88@gmail.com") {
      router.push("/");
    }
  }, [profile, router]);

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
    return <div className="min-h-dvh bg-[#0E1116] flex items-center justify-center text-white">Memeriksa akses...</div>;
  }

  const activePlayersCount = rooms.reduce((acc, room) => acc + Object.keys(room.players || {}).length, 0);
  const playingRooms = rooms.filter(r => r.status === "playing");

  return (
    <div className="min-h-dvh bg-[#0E1116] text-[#F5F5F5] p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-3 mb-8 border-b border-[#262B33] pb-4">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-green-500 border border-green-500/30">
            <Terminal size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-green-400 tracking-wider">PUSAT KOMANDO TANRA</h1>
            <p className="text-[#8A8F98] text-sm">Email: {profile.email}</p>
            <p className="text-[#8A8F98] text-[10px] font-mono mt-1">UID: {profile.uid}</p>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#171B22] p-6 rounded-2xl border border-[#262B33]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#8A8F98] font-medium">Ruang Aktif</p>
              <Activity className="text-blue-400" size={20} />
            </div>
            <p className="text-4xl font-bold font-display text-white">{rooms.length}</p>
            <p className="text-sm text-[#8A8F98] mt-2">{playingRooms.length} sedang bermain</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#171B22] p-6 rounded-2xl border border-[#262B33]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#8A8F98] font-medium">Pemain Online (Di Ruangan)</p>
              <Users className="text-green-400" size={20} />
            </div>
            <p className="text-4xl font-bold font-display text-white">{activePlayersCount}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#171B22] p-6 rounded-2xl border border-[#262B33]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#8A8F98] font-medium">Total Akun Terdaftar</p>
              <ShieldAlert className="text-[#C8A96B]" size={20} />
            </div>
            <p className="text-4xl font-bold font-display text-white">{totalUsers}</p>
          </motion.div>
        </div>

        {/* Rooms List */}
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Activity size={18} className="text-[#C8A96B]" /> Daftar Ruangan Server
        </h2>
        
        <div className="bg-[#171B22] rounded-2xl border border-[#262B33] overflow-hidden">
          {rooms.length === 0 ? (
            <div className="p-8 text-center text-[#8A8F98]">Tidak ada ruangan yang aktif saat ini.</div>
          ) : (
            <div className="divide-y divide-[#262B33]">
              {rooms.map((room) => (
                <div key={room.id} className="p-4 hover:bg-[#262B33]/30 transition-colors flex items-center justify-between">
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
                  
                  <div className="flex items-center gap-3">
                    {/* Developer Spectator Join Button */}
                    <button
                      onClick={() => {
                        localStorage.setItem("TANRA_GHOST_MODE", "true");
                        router.push(`/room/${room.id}`);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold transition-colors"
                    >
                      Intip (Ghost)
                    </button>
                    
                    <button
                      onClick={() => handleDeleteRoom(room.id)}
                      className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center border border-red-500/30 transition-colors"
                      title="Tutup Paksa Ruangan"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
