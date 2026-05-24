import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { WordPair, Difficulty } from "@/types";

// Fallback word pairs in case Firestore is not seeded
const FALLBACK_PAIRS: WordPair[] = [
  { id: "1", civilian: "Pantai", impostor: "Kolam", category: "Tempat", difficulty: "easy" },
  { id: "2", civilian: "Kopi", impostor: "Teh", category: "Minuman", difficulty: "easy" },
  { id: "3", civilian: "Wayang", impostor: "Boneka", category: "Seni", difficulty: "easy" },
  { id: "4", civilian: "Batik", impostor: "Tenun", category: "Kain", difficulty: "easy" },
  { id: "5", civilian: "Sate", impostor: "Tusuk", category: "Makanan", difficulty: "easy" },
  { id: "6", civilian: "Gamelan", impostor: "Gendang", category: "Musik", difficulty: "medium" },
  { id: "7", civilian: "Gunung", impostor: "Bukit", category: "Alam", difficulty: "easy" },
  { id: "8", civilian: "Keris", impostor: "Golok", category: "Senjata", difficulty: "medium" },
  { id: "9", civilian: "Pasar", impostor: "Toko", category: "Tempat", difficulty: "easy" },
  { id: "10", civilian: "Becak", impostor: "Bajaj", category: "Transportasi", difficulty: "medium" },
  { id: "11", civilian: "Padi", impostor: "Jagung", category: "Tanaman", difficulty: "easy" },
  { id: "12", civilian: "Sarung", impostor: "Kain", category: "Pakaian", difficulty: "easy" },
  { id: "13", civilian: "Angklung", impostor: "Suling", category: "Musik", difficulty: "medium" },
  { id: "14", civilian: "Rendang", impostor: "Gulai", category: "Makanan", difficulty: "medium" },
  { id: "15", civilian: "Naga", impostor: "Ular", category: "Makhluk", difficulty: "hard" },
  { id: "16", civilian: "Batavia", impostor: "Sunda", category: "Sejarah", difficulty: "hard" },
  { id: "17", civilian: "Bambu", impostor: "Rotan", category: "Material", difficulty: "easy" },
  { id: "18", civilian: "Warung", impostor: "Kantin", category: "Tempat", difficulty: "easy" },
  { id: "19", civilian: "Pinisi", impostor: "Perahu", category: "Transportasi", difficulty: "medium" },
  { id: "20", civilian: "Songket", impostor: "Ulos", category: "Kain", difficulty: "hard" },
  
  // -- TAMBAHAN 80 KATA BARU --
  // Kategori Makanan & Minuman
  { id: "21", civilian: "Bakso", impostor: "Sosis", category: "Makanan", difficulty: "easy" },
  { id: "22", civilian: "Nasi Goreng", impostor: "Mie Goreng", category: "Makanan", difficulty: "easy" },
  { id: "23", civilian: "Susu", impostor: "Yogurt", category: "Minuman", difficulty: "easy" },
  { id: "24", civilian: "Soto", impostor: "Sup", category: "Makanan", difficulty: "medium" },
  { id: "25", civilian: "Pempek", impostor: "Batagor", category: "Makanan", difficulty: "medium" },
  { id: "26", civilian: "Martabak", impostor: "Terang Bulan", category: "Makanan", difficulty: "medium" },
  { id: "27", civilian: "Gado-gado", impostor: "Ketoprak", category: "Makanan", difficulty: "hard" },
  { id: "28", civilian: "Kecap", impostor: "Saus", category: "Makanan", difficulty: "easy" },
  { id: "29", civilian: "Sambal", impostor: "Cabai", category: "Makanan", difficulty: "easy" },
  { id: "30", civilian: "Jamu", impostor: "Obat", category: "Minuman", difficulty: "medium" },

  // Kategori Tempat & Bangunan
  { id: "31", civilian: "Rumah Sakit", impostor: "Puskesmas", category: "Tempat", difficulty: "medium" },
  { id: "32", civilian: "Bandara", impostor: "Stasiun", category: "Tempat", difficulty: "easy" },
  { id: "33", civilian: "Masjid", impostor: "Gereja", category: "Tempat", difficulty: "easy" },
  { id: "34", civilian: "Candi", impostor: "Pura", category: "Tempat", difficulty: "medium" },
  { id: "35", civilian: "Gua", impostor: "Terowongan", category: "Tempat", difficulty: "medium" },
  { id: "36", civilian: "Apotek", impostor: "Klinik", category: "Tempat", difficulty: "hard" },
  { id: "37", civilian: "Halte", impostor: "Terminal", category: "Tempat", difficulty: "medium" },
  { id: "38", civilian: "Sekolah", impostor: "Kampus", category: "Tempat", difficulty: "easy" },
  { id: "39", civilian: "Perpustakaan", impostor: "Toko Buku", category: "Tempat", difficulty: "medium" },
  { id: "40", civilian: "Hotel", impostor: "Penginapan", category: "Tempat", difficulty: "easy" },

  // Kategori Hewan & Alam
  { id: "41", civilian: "Kucing", impostor: "Anjing", category: "Makhluk", difficulty: "easy" },
  { id: "42", civilian: "Burung", impostor: "Kelelawar", category: "Makhluk", difficulty: "medium" },
  { id: "43", civilian: "Harimau", impostor: "Singa", category: "Makhluk", difficulty: "easy" },
  { id: "44", civilian: "Komodo", impostor: "Biawak", category: "Makhluk", difficulty: "hard" },
  { id: "45", civilian: "Gajah", impostor: "Badak", category: "Makhluk", difficulty: "easy" },
  { id: "46", civilian: "Matahari", impostor: "Bulan", category: "Alam", difficulty: "easy" },
  { id: "47", civilian: "Hujan", impostor: "Salju", category: "Alam", difficulty: "easy" },
  { id: "48", civilian: "Danau", impostor: "Sungai", category: "Alam", difficulty: "medium" },
  { id: "49", civilian: "Hutan", impostor: "Taman", category: "Alam", difficulty: "easy" },
  { id: "50", civilian: "Gurun", impostor: "Pantai", category: "Alam", difficulty: "medium" },

  // Kategori Transportasi & Teknologi
  { id: "51", civilian: "Mobil", impostor: "Motor", category: "Transportasi", difficulty: "easy" },
  { id: "52", civilian: "Pesawat", impostor: "Helikopter", category: "Transportasi", difficulty: "easy" },
  { id: "53", civilian: "Kereta Api", impostor: "Trem", category: "Transportasi", difficulty: "medium" },
  { id: "54", civilian: "Sepeda", impostor: "Skuter", category: "Transportasi", difficulty: "easy" },
  { id: "55", civilian: "Kapal", impostor: "Rakit", category: "Transportasi", difficulty: "medium" },
  { id: "56", civilian: "Televisi", impostor: "Radio", category: "Teknologi", difficulty: "easy" },
  { id: "57", civilian: "Laptop", impostor: "Komputer", category: "Teknologi", difficulty: "medium" },
  { id: "58", civilian: "Kulkas", impostor: "AC", category: "Teknologi", difficulty: "medium" },
  { id: "59", civilian: "Kamera", impostor: "Lensa", category: "Teknologi", difficulty: "hard" },
  { id: "60", civilian: "Handphone", impostor: "Tablet", category: "Teknologi", difficulty: "easy" },

  // Kategori Benda Sehari-hari
  { id: "61", civilian: "Buku", impostor: "Majalah", category: "Material", difficulty: "easy" },
  { id: "62", civilian: "Pensil", impostor: "Pulpen", category: "Material", difficulty: "easy" },
  { id: "63", civilian: "Gelas", impostor: "Cangkir", category: "Material", difficulty: "medium" },
  { id: "64", civilian: "Piring", impostor: "Mangkok", category: "Material", difficulty: "easy" },
  { id: "65", civilian: "Sendok", impostor: "Garpu", category: "Material", difficulty: "easy" },
  { id: "66", civilian: "Kacamata", impostor: "Lensa Kontak", category: "Material", difficulty: "hard" },
  { id: "67", civilian: "Jam Tangan", impostor: "Gelang", category: "Material", difficulty: "medium" },
  { id: "68", civilian: "Sepatu", impostor: "Sandal", category: "Pakaian", difficulty: "easy" },
  { id: "69", civilian: "Kemeja", impostor: "Kaos", category: "Pakaian", difficulty: "easy" },
  { id: "70", civilian: "Celana", impostor: "Rok", category: "Pakaian", difficulty: "easy" },

  // Kategori Pekerjaan & Hobi
  { id: "71", civilian: "Dokter", impostor: "Perawat", category: "Pekerjaan", difficulty: "medium" },
  { id: "72", civilian: "Polisi", impostor: "Tentara", category: "Pekerjaan", difficulty: "easy" },
  { id: "73", civilian: "Guru", impostor: "Dosen", category: "Pekerjaan", difficulty: "medium" },
  { id: "74", civilian: "Penyanyi", impostor: "Musisi", category: "Pekerjaan", difficulty: "hard" },
  { id: "75", civilian: "Petani", impostor: "Nelayan", category: "Pekerjaan", difficulty: "easy" },
  { id: "76", civilian: "Pelukis", impostor: "Pematung", category: "Pekerjaan", difficulty: "hard" },
  { id: "77", civilian: "Berenang", impostor: "Menyelam", category: "Hobi", difficulty: "medium" },
  { id: "78", civilian: "Memancing", impostor: "Menjala", category: "Hobi", difficulty: "hard" },
  { id: "79", civilian: "Bersepeda", impostor: "Berlari", category: "Hobi", difficulty: "easy" },
  { id: "80", civilian: "Membaca", impostor: "Menulis", category: "Hobi", difficulty: "medium" },

  // Kategori Abstrak & Sulit (Medium-Hard)
  { id: "81", civilian: "Cinta", impostor: "Sayang", category: "Perasaan", difficulty: "hard" },
  { id: "82", civilian: "Sedih", impostor: "Kecewa", category: "Perasaan", difficulty: "hard" },
  { id: "83", civilian: "Marah", impostor: "Kesal", category: "Perasaan", difficulty: "hard" },
  { id: "84", civilian: "Mimpi", impostor: "Khayalan", category: "Abstrak", difficulty: "hard" },
  { id: "85", civilian: "Masa Depan", impostor: "Hari Esok", category: "Abstrak", difficulty: "hard" },
  { id: "86", civilian: "Angin", impostor: "Udara", category: "Alam", difficulty: "hard" },
  { id: "87", civilian: "Cahaya", impostor: "Lampu", category: "Alam", difficulty: "medium" },
  { id: "88", civilian: "Awan", impostor: "Kabut", category: "Alam", difficulty: "medium" },
  { id: "89", civilian: "Api", impostor: "Panas", category: "Alam", difficulty: "medium" },
  { id: "90", civilian: "Es", impostor: "Salju", category: "Alam", difficulty: "easy" },

  // Kategori Pop Culture & Modern
  { id: "91", civilian: "Bioskop", impostor: "Teater", category: "Tempat", difficulty: "medium" },
  { id: "92", civilian: "Instagram", impostor: "TikTok", category: "Teknologi", difficulty: "hard" },
  { id: "93", civilian: "Youtube", impostor: "Televisi", category: "Teknologi", difficulty: "medium" },
  { id: "94", civilian: "Gitar", impostor: "Bass", category: "Musik", difficulty: "hard" },
  { id: "95", civilian: "Piano", impostor: "Keyboard", category: "Musik", difficulty: "hard" },
  { id: "96", civilian: "Komik", impostor: "Novel", category: "Material", difficulty: "medium" },
  { id: "97", civilian: "Game", impostor: "Permainan", category: "Hobi", difficulty: "hard" },
  { id: "98", civilian: "Robot", impostor: "Mesin", category: "Teknologi", difficulty: "medium" },
  { id: "99", civilian: "Bintang", impostor: "Planet", category: "Alam", difficulty: "medium" },
  { id: "100", civilian: "Supermarket", impostor: "Pasar", category: "Tempat", difficulty: "easy" },

  // -- TAMBAHAN 200 KATA BARU --
  // Makanan & Minuman (101-140)
  { id: "101", civilian: "Soto Ayam", impostor: "Soto Daging", category: "Makanan", difficulty: "medium" },
  { id: "102", civilian: "Sate Kambing", impostor: "Sate Sapi", category: "Makanan", difficulty: "medium" },
  { id: "103", civilian: "Pizza", impostor: "Pasta", category: "Makanan", difficulty: "easy" },
  { id: "104", civilian: "Burger", impostor: "Hotdog", category: "Makanan", difficulty: "easy" },
  { id: "105", civilian: "Kebab", impostor: "Shawarma", category: "Makanan", difficulty: "hard" },
  { id: "106", civilian: "Spaghetti", impostor: "Makaroni", category: "Makanan", difficulty: "medium" },
  { id: "107", civilian: "Sirup", impostor: "Jus", category: "Minuman", difficulty: "easy" },
  { id: "108", civilian: "Kopi Hitam", impostor: "Kopi Susu", category: "Minuman", difficulty: "medium" },
  { id: "109", civilian: "Teh Manis", impostor: "Teh Tawar", category: "Minuman", difficulty: "easy" },
  { id: "110", civilian: "Cendol", impostor: "Dawet", category: "Minuman", difficulty: "hard" },
  { id: "111", civilian: "Es Campur", impostor: "Es Teler", category: "Minuman", difficulty: "hard" },
  { id: "112", civilian: "Kerupuk", impostor: "Keripik", category: "Makanan", difficulty: "easy" },
  { id: "113", civilian: "Roti", impostor: "Kue", category: "Makanan", difficulty: "easy" },
  { id: "114", civilian: "Donat", impostor: "Bagel", category: "Makanan", difficulty: "medium" },
  { id: "115", civilian: "Cokelat", impostor: "Permen", category: "Makanan", difficulty: "easy" },
  { id: "116", civilian: "Keju", impostor: "Mentega", category: "Makanan", difficulty: "medium" },
  { id: "117", civilian: "Bawang Merah", impostor: "Bawang Putih", category: "Makanan", difficulty: "easy" },
  { id: "118", civilian: "Garam", impostor: "Gula", category: "Makanan", difficulty: "easy" },
  { id: "119", civilian: "Merica", impostor: "Ketumbar", category: "Makanan", difficulty: "hard" },
  { id: "120", civilian: "Jahe", impostor: "Kunyit", category: "Makanan", difficulty: "hard" },
  { id: "121", civilian: "Lengkuas", impostor: "Kencur", category: "Makanan", difficulty: "hard" },
  { id: "122", civilian: "Santan", impostor: "Susu", category: "Makanan", difficulty: "medium" },
  { id: "123", civilian: "Kari", impostor: "Opor", category: "Makanan", difficulty: "medium" },
  { id: "124", civilian: "Rawon", impostor: "Pecel", category: "Makanan", difficulty: "medium" },
  { id: "125", civilian: "Gudeg", impostor: "Sayur Nangka", category: "Makanan", difficulty: "hard" },
  { id: "126", civilian: "Lemper", impostor: "Lontong", category: "Makanan", difficulty: "medium" },
  { id: "127", civilian: "Ketupat", impostor: "Burasa", category: "Makanan", difficulty: "hard" },
  { id: "128", civilian: "Serabi", impostor: "Pancake", category: "Makanan", difficulty: "medium" },
  { id: "129", civilian: "Kue Cubit", impostor: "Pukis", category: "Makanan", difficulty: "hard" },
  { id: "130", civilian: "Onde-onde", impostor: "Klepon", category: "Makanan", difficulty: "hard" },
  { id: "131", civilian: "Bika Ambon", impostor: "Lapis Legit", category: "Makanan", difficulty: "medium" },
  { id: "132", civilian: "Asinan", impostor: "Rujak", category: "Makanan", difficulty: "medium" },
  { id: "133", civilian: "Nastar", impostor: "Kastengel", category: "Makanan", difficulty: "medium" },
  { id: "134", civilian: "Kurma", impostor: "Kismis", category: "Makanan", difficulty: "medium" },
  { id: "135", civilian: "Anggur", impostor: "Stroberi", category: "Makanan", difficulty: "easy" },
  { id: "136", civilian: "Pisang", impostor: "Pepaya", category: "Makanan", difficulty: "easy" },
  { id: "137", civilian: "Mangga", impostor: "Jeruk", category: "Makanan", difficulty: "easy" },
  { id: "138", civilian: "Durian", impostor: "Nangka", category: "Makanan", difficulty: "medium" },
  { id: "139", civilian: "Semangka", impostor: "Melon", category: "Makanan", difficulty: "easy" },
  { id: "140", civilian: "Apel", impostor: "Pir", category: "Makanan", difficulty: "easy" },

  // Tempat & Bangunan (141-180)
  { id: "141", civilian: "Alun-alun", impostor: "Taman Kota", category: "Tempat", difficulty: "medium" },
  { id: "142", civilian: "Gedung Sate", impostor: "Monas", category: "Tempat", difficulty: "easy" },
  { id: "143", civilian: "Istana", impostor: "Kastil", category: "Tempat", difficulty: "medium" },
  { id: "144", civilian: "Museum", impostor: "Galeri", category: "Tempat", difficulty: "medium" },
  { id: "145", civilian: "Kebun Binatang", impostor: "Taman Safari", category: "Tempat", difficulty: "medium" },
  { id: "146", civilian: "Stadion", impostor: "Gelanggang Olahraga", category: "Tempat", difficulty: "medium" },
  { id: "147", civilian: "Kolam Renang", impostor: "Waterboom", category: "Tempat", difficulty: "easy" },
  { id: "148", civilian: "Pabrik", impostor: "Gudang", category: "Tempat", difficulty: "medium" },
  { id: "149", civilian: "Kantor", impostor: "Ruko", category: "Tempat", difficulty: "easy" },
  { id: "150", civilian: "Apartemen", impostor: "Rusun", category: "Tempat", difficulty: "easy" },
  { id: "151", civilian: "Villa", impostor: "Resort", category: "Tempat", difficulty: "medium" },
  { id: "152", civilian: "Tenda", impostor: "Kemah", category: "Tempat", difficulty: "easy" },
  { id: "153", civilian: "Kost", impostor: "Asrama", category: "Tempat", difficulty: "easy" },
  { id: "154", civilian: "Bengkel", impostor: "Garasi", category: "Tempat", difficulty: "medium" },
  { id: "155", civilian: "Pom Bensin", impostor: "SPBU", category: "Tempat", difficulty: "easy" },
  { id: "156", civilian: "Restoran", impostor: "Kafe", category: "Tempat", difficulty: "easy" },
  { id: "157", civilian: "Bank", impostor: "Pegadaian", category: "Tempat", difficulty: "medium" },
  { id: "158", civilian: "Pasar Tradisional", impostor: "Supermarket", category: "Tempat", difficulty: "easy" },
  { id: "159", civilian: "Mall", impostor: "Plaza", category: "Tempat", difficulty: "medium" },
  { id: "160", civilian: "Pelabuhan", impostor: "Dermaga", category: "Tempat", difficulty: "hard" },
  { id: "161", civilian: "Puskesmas", impostor: "Klinik", category: "Tempat", difficulty: "medium" },
  { id: "162", civilian: "Penjara", impostor: "Sel", category: "Tempat", difficulty: "easy" },
  { id: "163", civilian: "Pengadilan", impostor: "Kejaksaan", category: "Tempat", difficulty: "hard" },
  { id: "164", civilian: "Gereja", impostor: "Kapel", category: "Tempat", difficulty: "hard" },
  { id: "165", civilian: "Vihara", impostor: "Kelenteng", category: "Tempat", difficulty: "hard" },
  { id: "166", civilian: "Pura", impostor: "Candi", category: "Tempat", difficulty: "medium" },
  { id: "167", civilian: "Balai Kota", impostor: "Kecamatan", category: "Tempat", difficulty: "medium" },
  { id: "168", civilian: "Laboratorium", impostor: "Observatorium", category: "Tempat", difficulty: "hard" },
  { id: "169", civilian: "Panti Asuhan", impostor: "Panti Jompo", category: "Tempat", difficulty: "medium" },
  { id: "170", civilian: "Bioskop", impostor: "Teater", category: "Tempat", difficulty: "medium" },
  { id: "171", civilian: "Diskotek", impostor: "Klub Malam", category: "Tempat", difficulty: "medium" },
  { id: "172", civilian: "Warnet", impostor: "Game Center", category: "Tempat", difficulty: "easy" },
  { id: "173", civilian: "Salon", impostor: "Barbershop", category: "Tempat", difficulty: "easy" },
  { id: "174", civilian: "Pusat Kebugaran", impostor: "Gym", category: "Tempat", difficulty: "easy" },
  { id: "175", civilian: "Panti Pijat", impostor: "Spa", category: "Tempat", difficulty: "medium" },
  { id: "176", civilian: "Toko Roti", impostor: "Bakery", category: "Tempat", difficulty: "easy" },
  { id: "177", civilian: "Toko Bunga", impostor: "Florist", category: "Tempat", difficulty: "easy" },
  { id: "178", civilian: "Butik", impostor: "Distro", category: "Tempat", difficulty: "medium" },
  { id: "179", civilian: "Minimarket", impostor: "Warung", category: "Tempat", difficulty: "easy" },
  { id: "180", civilian: "Toko Buku", impostor: "Perpustakaan", category: "Tempat", difficulty: "medium" },

  // Hewan & Alam (181-220)
  { id: "181", civilian: "Sapi", impostor: "Kerbau", category: "Makhluk", difficulty: "easy" },
  { id: "182", civilian: "Kambing", impostor: "Domba", category: "Makhluk", difficulty: "easy" },
  { id: "183", civilian: "Kuda", impostor: "Keledai", category: "Makhluk", difficulty: "medium" },
  { id: "184", civilian: "Zebra", impostor: "Kuda Nil", category: "Makhluk", difficulty: "hard" },
  { id: "185", civilian: "Jerapah", impostor: "Unta", category: "Makhluk", difficulty: "medium" },
  { id: "186", civilian: "Monyet", impostor: "Kera", category: "Makhluk", difficulty: "hard" },
  { id: "187", civilian: "Orangutan", impostor: "Gorila", category: "Makhluk", difficulty: "medium" },
  { id: "188", civilian: "Beruang", impostor: "Panda", category: "Makhluk", difficulty: "easy" },
  { id: "189", civilian: "Serigala", impostor: "Anjing Hutan", category: "Makhluk", difficulty: "medium" },
  { id: "190", civilian: "Rubah", impostor: "Musang", category: "Makhluk", difficulty: "hard" },
  { id: "191", civilian: "Singa", impostor: "Macan Tutul", category: "Makhluk", difficulty: "medium" },
  { id: "192", civilian: "Cheetah", impostor: "Jaguar", category: "Makhluk", difficulty: "hard" },
  { id: "193", civilian: "Buaya", impostor: "Aligator", category: "Makhluk", difficulty: "hard" },
  { id: "194", civilian: "Kura-kura", impostor: "Penyu", category: "Makhluk", difficulty: "medium" },
  { id: "195", civilian: "Katak", impostor: "Kodok", category: "Makhluk", difficulty: "easy" },
  { id: "196", civilian: "Ikan Hiu", impostor: "Paus", category: "Makhluk", difficulty: "medium" },
  { id: "197", civilian: "Lumba-lumba", impostor: "Pesut", category: "Makhluk", difficulty: "hard" },
  { id: "198", civilian: "Ubur-ubur", impostor: "Gurita", category: "Makhluk", difficulty: "medium" },
  { id: "199", civilian: "Cumi-cumi", impostor: "Sotong", category: "Makhluk", difficulty: "hard" },
  { id: "200", civilian: "Kepiting", impostor: "Lobster", category: "Makhluk", difficulty: "medium" },
  { id: "201", civilian: "Udang", impostor: "Rebon", category: "Makhluk", difficulty: "hard" },
  { id: "202", civilian: "Kupu-kupu", impostor: "Ngengat", category: "Makhluk", difficulty: "medium" },
  { id: "203", civilian: "Lebah", impostor: "Tawon", category: "Makhluk", difficulty: "easy" },
  { id: "204", civilian: "Semut", impostor: "Rayap", category: "Makhluk", difficulty: "easy" },
  { id: "205", civilian: "Laba-laba", impostor: "Kalajengking", category: "Makhluk", difficulty: "medium" },
  { id: "206", civilian: "Nyamuk", impostor: "Lalat", category: "Makhluk", difficulty: "easy" },
  { id: "207", civilian: "Kecoa", impostor: "Jangkrik", category: "Makhluk", difficulty: "easy" },
  { id: "208", civilian: "Cacing", impostor: "Lintah", category: "Makhluk", difficulty: "medium" },
  { id: "209", civilian: "Pohon", impostor: "Tanaman", category: "Alam", difficulty: "easy" },
  { id: "210", civilian: "Rumput", impostor: "Ilalang", category: "Alam", difficulty: "medium" },
  { id: "211", civilian: "Daun", impostor: "Ranting", category: "Alam", difficulty: "easy" },
  { id: "212", civilian: "Akar", impostor: "Batang", category: "Alam", difficulty: "medium" },
  { id: "213", civilian: "Bunga", impostor: "Kembang", category: "Alam", difficulty: "easy" },
  { id: "214", civilian: "Mawar", impostor: "Melati", category: "Alam", difficulty: "easy" },
  { id: "215", civilian: "Anggrek", impostor: "Teratai", category: "Alam", difficulty: "medium" },
  { id: "216", civilian: "Gunung Berapi", impostor: "Kawah", category: "Alam", difficulty: "medium" },
  { id: "217", civilian: "Lembah", impostor: "Ngarai", category: "Alam", difficulty: "hard" },
  { id: "218", civilian: "Gua", impostor: "Jurang", category: "Alam", difficulty: "medium" },
  { id: "219", civilian: "Air Terjun", impostor: "Sungai", category: "Alam", difficulty: "easy" },
  { id: "220", civilian: "Mata Air", impostor: "Sumur", category: "Alam", difficulty: "medium" },

  // Transportasi, Teknologi & Barang (221-300)
  { id: "221", civilian: "Truk", impostor: "Tronton", category: "Transportasi", difficulty: "medium" },
  { id: "222", civilian: "Bus", impostor: "Minibus", category: "Transportasi", difficulty: "easy" },
  { id: "223", civilian: "Taksi", impostor: "Angkot", category: "Transportasi", difficulty: "medium" },
  { id: "224", civilian: "Delman", impostor: "Andong", category: "Transportasi", difficulty: "hard" },
  { id: "225", civilian: "Becak Motor", impostor: "Bentor", category: "Transportasi", difficulty: "hard" },
  { id: "226", civilian: "Kapal Feri", impostor: "Kapal Pesiar", category: "Transportasi", difficulty: "medium" },
  { id: "227", civilian: "Kapal Selam", impostor: "Torpedo", category: "Transportasi", difficulty: "hard" },
  { id: "228", civilian: "Balon Udara", impostor: "Zeppelin", category: "Transportasi", difficulty: "hard" },
  { id: "229", civilian: "Roket", impostor: "Pesawat Ulang Alik", category: "Transportasi", difficulty: "medium" },
  { id: "230", civilian: "Satelit", impostor: "Stasiun Luar Angkasa", category: "Teknologi", difficulty: "hard" },
  { id: "231", civilian: "Smartwatch", impostor: "Jam Tangan", category: "Teknologi", difficulty: "medium" },
  { id: "232", civilian: "Earphone", impostor: "Headphone", category: "Teknologi", difficulty: "easy" },
  { id: "233", civilian: "Speaker", impostor: "Microphone", category: "Teknologi", difficulty: "easy" },
  { id: "234", civilian: "Mouse", impostor: "Keyboard", category: "Teknologi", difficulty: "easy" },
  { id: "235", civilian: "Monitor", impostor: "Proyektor", category: "Teknologi", difficulty: "medium" },
  { id: "236", civilian: "Flashdisk", impostor: "Harddisk", category: "Teknologi", difficulty: "medium" },
  { id: "237", civilian: "Printer", impostor: "Scanner", category: "Teknologi", difficulty: "easy" },
  { id: "238", civilian: "Kipas Angin", impostor: "AC", category: "Teknologi", difficulty: "easy" },
  { id: "239", civilian: "Setrika", impostor: "Mesin Cuci", category: "Teknologi", difficulty: "medium" },
  { id: "240", civilian: "Kompor", impostor: "Oven", category: "Teknologi", difficulty: "easy" },
  { id: "241", civilian: "Pisau", impostor: "Gunting", category: "Material", difficulty: "easy" },
  { id: "242", civilian: "Palu", impostor: "Tang", category: "Material", difficulty: "medium" },
  { id: "243", civilian: "Obeng", impostor: "Kunci Inggris", category: "Material", difficulty: "medium" },
  { id: "244", civilian: "Paku", impostor: "Baut", category: "Material", difficulty: "medium" },
  { id: "245", civilian: "Gergaji", impostor: "Kapak", category: "Material", difficulty: "medium" },
  { id: "246", civilian: "Cangkul", impostor: "Sekop", category: "Material", difficulty: "easy" },
  { id: "247", civilian: "Sapu", impostor: "Pel", category: "Material", difficulty: "easy" },
  { id: "248", civilian: "Kemoceng", impostor: "Kain Lap", category: "Material", difficulty: "medium" },
  { id: "249", civilian: "Ember", impostor: "Gayung", category: "Material", difficulty: "easy" },
  { id: "250", civilian: "Handuk", impostor: "Selimut", category: "Material", difficulty: "easy" },
  { id: "251", civilian: "Bantal", impostor: "Guling", category: "Material", difficulty: "easy" },
  { id: "252", civilian: "Kasur", impostor: "Sofa", category: "Material", difficulty: "easy" },
  { id: "253", civilian: "Kursi", impostor: "Bangku", category: "Material", difficulty: "medium" },
  { id: "254", civilian: "Meja", impostor: "Lemari", category: "Material", difficulty: "easy" },
  { id: "255", civilian: "Pintu", impostor: "Jendela", category: "Material", difficulty: "easy" },
  { id: "256", civilian: "Atap", impostor: "Plafon", category: "Material", difficulty: "medium" },
  { id: "257", civilian: "Lantai", impostor: "Karpet", category: "Material", difficulty: "easy" },
  { id: "258", civilian: "Cermin", impostor: "Kaca", category: "Material", difficulty: "medium" },
  { id: "259", civilian: "Sisir", impostor: "Sikat Rambut", category: "Material", difficulty: "easy" },
  { id: "260", civilian: "Sikat Gigi", impostor: "Pasta Gigi", category: "Material", difficulty: "easy" },
  { id: "261", civilian: "Sabun", impostor: "Sampo", category: "Material", difficulty: "easy" },
  { id: "262", civilian: "Parfum", impostor: "Deodoran", category: "Material", difficulty: "medium" },
  { id: "263", civilian: "Bedak", impostor: "Lipstik", category: "Material", difficulty: "medium" },
  { id: "264", civilian: "Anting", impostor: "Kalung", category: "Material", difficulty: "easy" },
  { id: "265", civilian: "Cincin", impostor: "Bros", category: "Material", difficulty: "medium" },
  { id: "266", civilian: "Tas", impostor: "Koper", category: "Material", difficulty: "easy" },
  { id: "267", civilian: "Dompet", impostor: "Kantong", category: "Material", difficulty: "easy" },
  { id: "268", civilian: "Payung", impostor: "Jas Hujan", category: "Material", difficulty: "easy" },
  { id: "269", civilian: "Topi", impostor: "Helm", category: "Pakaian", difficulty: "easy" },
  { id: "270", civilian: "Dasi", impostor: "Pita", category: "Pakaian", difficulty: "medium" },
  { id: "271", civilian: "Jaket", impostor: "Mantel", category: "Pakaian", difficulty: "easy" },
  { id: "272", civilian: "Kaos Kaki", impostor: "Sepatu", category: "Pakaian", difficulty: "easy" },
  { id: "273", civilian: "Kertas", impostor: "Karton", category: "Material", difficulty: "medium" },
  { id: "274", civilian: "Plastik", impostor: "Karet", category: "Material", difficulty: "medium" },
  { id: "275", civilian: "Kayu", impostor: "Bambu", category: "Material", difficulty: "easy" },
  { id: "276", civilian: "Besi", impostor: "Baja", category: "Material", difficulty: "medium" },
  { id: "277", civilian: "Emas", impostor: "Perak", category: "Material", difficulty: "easy" },
  { id: "278", civilian: "Intan", impostor: "Berlian", category: "Material", difficulty: "hard" },
  { id: "279", civilian: "Batu", impostor: "Kerikil", category: "Material", difficulty: "easy" },
  { id: "280", civilian: "Pasir", impostor: "Tanah", category: "Material", difficulty: "easy" },
  { id: "281", civilian: "Sopir", impostor: "Masinis", category: "Pekerjaan", difficulty: "medium" },
  { id: "282", civilian: "Pilot", impostor: "Nakhoda", category: "Pekerjaan", difficulty: "medium" },
  { id: "283", civilian: "Arsitek", impostor: "Insinyur", category: "Pekerjaan", difficulty: "hard" },
  { id: "284", civilian: "Pramugari", impostor: "Resepsionis", category: "Pekerjaan", difficulty: "medium" },
  { id: "285", civilian: "Koki", impostor: "Bartender", category: "Pekerjaan", difficulty: "easy" },
  { id: "286", civilian: "Penulis", impostor: "Wartawan", category: "Pekerjaan", difficulty: "medium" },
  { id: "287", civilian: "Fotografer", impostor: "Kameramen", category: "Pekerjaan", difficulty: "medium" },
  { id: "288", civilian: "Aktor", impostor: "Sutradara", category: "Pekerjaan", difficulty: "medium" },
  { id: "289", civilian: "Presiden", impostor: "Menteri", category: "Pekerjaan", difficulty: "medium" },
  { id: "290", civilian: "Raja", impostor: "Pangeran", category: "Pekerjaan", difficulty: "easy" },
  { id: "291", civilian: "Sepak Bola", impostor: "Futsal", category: "Hobi", difficulty: "easy" },
  { id: "292", civilian: "Bulu Tangkis", impostor: "Tenis", category: "Hobi", difficulty: "easy" },
  { id: "293", civilian: "Bola Basket", impostor: "Bola Voli", category: "Hobi", difficulty: "medium" },
  { id: "294", civilian: "Catur", impostor: "Halma", category: "Hobi", difficulty: "medium" },
  { id: "295", civilian: "Karate", impostor: "Taekwondo", category: "Hobi", difficulty: "medium" },
  { id: "296", civilian: "Menari", impostor: "Menyanyi", category: "Hobi", difficulty: "easy" },
  { id: "297", civilian: "Melukis", impostor: "Menggambar", category: "Hobi", difficulty: "medium" },
  { id: "298", civilian: "Berkemah", impostor: "Mendaki", category: "Hobi", difficulty: "medium" },
  { id: "299", civilian: "Fotografi", impostor: "Melukis", category: "Hobi", difficulty: "hard" },
  { id: "300", civilian: "Main Game", impostor: "Nonton Film", category: "Hobi", difficulty: "easy" },
];

export async function getRandomWordPair(difficulty?: Difficulty, category?: string): Promise<WordPair> {
  try {
    let q = collection(db, "wordPairs");
    const pairs: WordPair[] = [];

    // Fallback if firestore is empty
    let fallback = FALLBACK_PAIRS;
    if (difficulty) fallback = fallback.filter((p) => p.difficulty === difficulty);
    if (category && category !== "Semua Kategori") {
      fallback = fallback.filter((p) => p.category === category);
    }
    
    // In a real app we would use compound queries, but for simplicity we fetch and filter
    const snap = await getDocs(q);
    snap.forEach((d) => pairs.push({ id: d.id, ...d.data() } as WordPair));

    let finalPairs = pairs.length > 0 ? pairs : fallback;
    
    if (difficulty) finalPairs = finalPairs.filter((p) => p.difficulty === difficulty);
    if (category && category !== "Semua Kategori") {
      finalPairs = finalPairs.filter((p) => p.category === category);
    }

    if (finalPairs.length === 0) {
      // If nothing matches the filter, fallback to any random word
      finalPairs = FALLBACK_PAIRS;
    }

    return finalPairs[Math.floor(Math.random() * finalPairs.length)];
  } catch {
    let fallback = FALLBACK_PAIRS;
    if (difficulty) fallback = fallback.filter((p) => p.difficulty === difficulty);
    if (category && category !== "Semua Kategori") fallback = fallback.filter((p) => p.category === category);
    
    if (fallback.length === 0) fallback = FALLBACK_PAIRS;
    return fallback[Math.floor(Math.random() * fallback.length)];
  }
}

export async function seedWordPairs(): Promise<void> {
  const { setDoc, doc } = await import("firebase/firestore");
  for (const pair of FALLBACK_PAIRS) {
    await setDoc(doc(db, "wordPairs", pair.id), pair);
  }
}

export { FALLBACK_PAIRS };
