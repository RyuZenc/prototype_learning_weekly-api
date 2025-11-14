// controllers/userController.js
const { db: csvData } = require('../services/dataService');
const db = require('../services/database.js');

// --- HELPER UNTUK STREAK ---
function calculateStreak(trackings, userId) {
  const userCompletions = trackings.filter(
    (t) => t.developer_id && t.developer_id == userId && t.completed_at
  );
  const completedDates = new Set(
    userCompletions.map((t) => new Date(t.completed_at).toDateString())
  );
  let currentStreak = 0;
  let today = new Date();
  while (completedDates.has(today.toDateString())) {
    currentStreak++;
    today.setDate(today.getDate() - 1);
  }
  return { currentStreak, bestStreak: 10 };
}

// --- HELPER UNTUK ACTIVITY CARD ---
function getActivityStats(userId) {
  const today = new Date();
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const modulesThisWeek = csvData.trackings.filter(
    (t) =>
      t.developer_id &&
      t.developer_id == userId &&
      t.completed_at &&
      new Date(t.completed_at) >= oneWeekAgo
  ).length;

  const submissions = csvData.submissions.filter(
    (s) => s.submitter_id && s.submitter_id == userId
  ).length;

  const assessments = csvData.examResults.filter((r) => r.is_passed === '1').length;

  const completedJourneys = csvData.completions
    .filter((c) => c.user_id && c.user_id == userId)
    .map((c) => c.journey_id);

  const learningHours = csvData.journeys
    .filter((j) => j.id && completedJourneys.includes(j.id))
    .reduce((sum, j) => sum + parseInt(j.hours_to_study || 0), 0);

  return {
    mainStatLabel: `${modulesThisWeek} Modul Selesai`,
    mainStatPercent: '▲ 20%',
    courses: completedJourneys.length,
    learningHours: learningHours,
    assessments: 10, // Dummy
    submission: submissions,
  };
}

// --- FUNGSI ENDPOINT ---

// GET /api/user/:userId/streak
exports.getStreak = (req, res) => {
  const { userId } = req.params;
  const user = csvData.users.find((u) => u.id && u.id == userId);
  if (!user) {
    return res.status(404).json({ error: 'User tidak ditemukan' });
  }
  const streakData = calculateStreak(csvData.trackings, userId);
  res.json(streakData);
};

// GET /api/user/:userId/activity
exports.getActivity = (req, res) => {
  const { userId } = req.params;
  const user = csvData.users.find((u) => u.id && u.id == userId);
  if (!user) {
    return res.status(404).json({ error: 'User tidak ditemukan' });
  }
  const activityData = getActivityStats(userId);
  res.json(activityData);
};

// --- FUNGSI ENDPOINT (Data Database SQLite) ---

// GET /api/user/:userId/check-ins
exports.getCheckIns = (req, res) => {
  const { userId } = req.params;
  
  const sql = "SELECT * FROM check_ins WHERE user_id = ?";
  
  db.all(sql, [userId], (err, rows) => {
    if (err) {
      console.error("Error getCheckIns:", err.message);
      return res.status(500).json({ error: err.message });
    }
    // 'rows' akan berupa array, sama seperti 'userCheckIns.get()' sebelumnya
    res.json(rows);
  });
};

// POST /api/user/:userId/check-ins
exports.addCheckIn = (req, res) => {
  const { userId } = req.params;
  const { date, mood, progress } = req.body;
  const status = 'Submitted'; // Status default saat submit

  if (!date || !mood || !progress) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }

  // "INSERT OR REPLACE" adalah trik SQL:
  // Jika (user_id, date) sudah ada, ia akan UPDATE.
  // Jika belum ada, ia akan INSERT (tambah baru).
  const sql = `
    INSERT OR REPLACE INTO check_ins (user_id, date, mood, progress, status)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [userId, date, mood, progress, status], function(err) {
    if (err) {
      console.error("Error addCheckIn:", err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log(`Check-in baru untuk ${userId} di ${date}: ${mood}`);
    // Kirim kembali data yang baru saja disimpan
    res.status(201).json({ date, mood, progress, status });
  });
};

// GET /api/user/:userId/schedule
exports.getSchedule = (req, res) => {
  const { userId } = req.params;

  const sql = "SELECT * FROM schedules WHERE user_id = ?";
  
  db.get(sql, [userId], (err, row) => {
    if (err) {
      console.error("Error getSchedule:", err.message);
      return res.status(500).json({ error: err.message });
    }
    
    if (row) {
      // Ubah 1/0 (database) menjadi true/false (JSON)
      const schedule = {};
      Object.keys(row).forEach(key => {
        if (key !== 'user_id') {
          schedule[key] = Boolean(row[key]);
        }
      });
      res.json(schedule);
    } else {
      // Jika user belum ada di tabel, kirim jadwal default
      // (Database sudah kita atur defaultnya, tapi ini untuk keamanan)
      const defaultSchedule = {
        Monday: false, Tuesday: false, Wednesday: false,
        Thursday: true, Friday: true, Saturday: true, Sunday: false
      };
      res.json(defaultSchedule);
    }
  });
};

// POST /api/user/:userId/schedule
exports.setSchedule = (req, res) => {
  const { userId } = req.params;
  const newSchedule = req.body; // { Monday: true, Tuesday: false, ... }

  const sql = `
    INSERT OR REPLACE INTO schedules (
      user_id, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  // Ubah true/false (JSON) menjadi 1/0 (database)
  const params = [
    userId,
    newSchedule.Monday ? 1 : 0,
    newSchedule.Tuesday ? 1 : 0,
    newSchedule.Wednesday ? 1 : 0,
    newSchedule.Thursday ? 1 : 0,
    newSchedule.Friday ? 1 : 0,
    newSchedule.Saturday ? 1 : 0,
    newSchedule.Sunday ? 1 : 0
  ];

  db.run(sql, params, function(err) {
    if (err) {
      console.error("Error setSchedule:", err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log(`Jadwal baru untuk ${userId}:`, newSchedule);
    res.status(200).json(newSchedule);
  });
};