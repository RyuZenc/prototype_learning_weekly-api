// services/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ini akan membuat file 'main.db' di dalam folder root API Anda
const dbPath = path.resolve(__dirname, '../main.db');

// Buat koneksi ke database.
// File 'main.db' akan otomatis dibuat jika belum ada.
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error saat menyambungkan ke database:', err.message);
  } else {
    console.log('✅ Berhasil tersambung ke database SQLite.');
  }
});

// --- BUAT TABEL SAAT SERVER PERTAMA KALI BERJALAN ---

// Gunakan .serialize() untuk memastikan query berjalan satu per satu
db.serialize(() => {
  // 1. Buat tabel untuk Daily Check-in
  db.run(`
    CREATE TABLE IF NOT EXISTS check_ins (
      user_id TEXT,
      date TEXT,
      mood TEXT,
      progress TEXT,
      status TEXT,
      PRIMARY KEY (user_id, date)
    )
  `, (err) => {
    if (err) console.error("Error buat tabel check_ins:", err.message);
    else console.log("Tabel 'check_ins' siap.");
  });

  // 2. Buat tabel untuk Jadwal Belajar
  // Kita beri nilai DEFAULT sesuai prototipe (Kam, Jum, Sab = 1 atau true)
  db.run(`
    CREATE TABLE IF NOT EXISTS schedules (
      user_id TEXT PRIMARY KEY,
      Monday INTEGER DEFAULT 0,
      Tuesday INTEGER DEFAULT 0,
      Wednesday INTEGER DEFAULT 0,
      Thursday INTEGER DEFAULT 1,
      Friday INTEGER DEFAULT 1,
      Saturday INTEGER DEFAULT 1,
      Sunday INTEGER DEFAULT 0
    )
  `, (err) => {
    if (err) console.error("Error buat tabel schedules:", err.message);
    else console.log("Tabel 'schedules' siap.");
  });
});

// Ekspor koneksi 'db' agar bisa dipakai di controller
module.exports = db;