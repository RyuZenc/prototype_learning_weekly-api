// services/dataService.js
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const db = {
  users: [],
  trackings: [],
  tutorials: [],
  journeys: [],
  submissions: [],
  completions: [],
  examResults: []
};

function loadCsv(filename) {
  return new Promise((resolve, reject) => {
    const results = [];
    const filePath = path.join(__dirname, '../data', filename);

    fs.createReadStream(filePath)
      .pipe(csv({
        // --- [FIX BARU DI SINI] ---
        bom: true, // 1. Otomatis deteksi dan hapus BOM dari Excel
        mapHeaders: ({ header }) => header.trim(), // 2. Tetap bersihkan header
        mapValues: ({ value }) => value.trim() // 3. Bersihkan semua nilai data (hapus spasi)
      }))
      .on('data', (data) => results.push(data))
      .on('end', () => {
        console.log(`✅ Berhasil memuat ${filename}`);
        resolve(results);
      })
      .on('error', (error) => reject(error));
  });
}

// Fungsi utama untuk memuat semua data
async function loadData() {
  console.log('Memulai memuat data dari CSV...');
  try {
    const [
      users,
      trackings,
      tutorials,
      journeys,
      submissions,
      completions,
      examResults
    ] = await Promise.all([
      loadCsv('users.csv'),
      loadCsv('trackings.csv'),
      loadCsv('tutorials.csv'),
      loadCsv('journeys.csv'),
      loadCsv('submissions.csv'),
      loadCsv('completions.csv'),
      loadCsv('exam_results.csv')
    ]);

    db.users = users;
    db.trackings = trackings;
    db.tutorials = tutorials;
    db.journeys = journeys;
    db.submissions = submissions;
    db.completions = completions;
    db.examResults = examResults;

    console.log('🎉 Semua data CSV berhasil dimuat ke memori.');
  } catch (error) {
    console.error('❌ Gagal memuat data CSV:', error);
    process.exit(1); 
  }
}

module.exports = {
  db,
  loadData
};