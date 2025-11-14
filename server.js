// server.js
const express = require('express');
const cors = require('cors');
const { loadData } = require('./services/dataService');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = 3000; // Port untuk Back-End Anda

// --- Middleware ---
// 1. CORS: Izinkan Front-End (Vite di port 5173) mengakses API ini
app.use(cors({
  origin: 'http://localhost:5173' // Sesuaikan jika port FE Anda berbeda
}));

// 2. Body Parser: Izinkan server membaca JSON dari body POST/PUT
app.use(express.json());

// --- Routes ---
// Gunakan semua rute yang ada di userRoutes.js dengan awalan /api
app.use('/api', userRoutes);

// --- Halaman Utama ---
app.get('/', (req, res) => {
  res.send('Selamat Datang di Learning Weekly Target API! 🚀');
});

// --- Mulai Server ---
// Kita harus memuat data CSV *sebelum* server mulai menerima permintaan
console.log('Menyiapkan server...');
loadData().then(() => {
  app.listen(PORT, () => {
    console.log(`🎉 Server API berjalan di http://localhost:${PORT}`);
    console.log('API siap menerima permintaan dari Front-End Anda.');
  });
}).catch(error => {
    console.error("Gagal memulai server:", error);
});