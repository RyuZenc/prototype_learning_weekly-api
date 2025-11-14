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
        separator: ';', // SUDAH BENAR
        bom: true,      // SUDAH BENAR
        mapHeaders: ({ header }) => header.trim(), // SUDAH BENAR
        
        // --- [INI PERBAIKAN FINALNYA] ---
        mapValues: ({ header, value }) => {
          const trimmedValue = value.trim();
          
          // Daftar semua kolom ID yang mungkin diformat Excel sebagai "96.989"
          const idHeaders = [
            'id', 'user_id', 'journey_id', 'tutorial_id', 
            'developer_id', 'submitter_id', 'quiz_id', 'version_id',
            'reviewer_id', 'current_reviewer', 'exam_module_id',
            'examinees_id', 'exam_registration_id', 'platform_id',
            'instructor_id', 'installment_plan_id', 'city_id'
          ];

          if (idHeaders.includes(header)) {
            // Hapus semua titik dari string. "96.989" -> "96989"
            return trimmedValue.replace(/\./g, '');
          }
          return trimmedValue; // Kembalikan nilai lain (seperti email, path) apa adanya
        }
      }))
      .on('data', (data) => results.push(data))
      .on('end', () => {
        console.log(`✅ Berhasil memuat ${filename}`);
        resolve(results);
      })
      .on('error', (error) => reject(error));
  });
}

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
  } catch (error)
 {
    console.error('❌ Gagal memuat data CSV:', error);
    process.exit(1); 
  }
}

module.exports = {
  db,
  loadData
};