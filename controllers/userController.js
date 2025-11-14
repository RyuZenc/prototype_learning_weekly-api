// controllers/userController.js
const { db } = require('../services/dataService');

// Database sementara
const userCheckIns = new Map();
const userSchedules = new Map();

// --- HELPER UNTUK STREAK ---
function calculateStreak(trackings, userId) {
  // Gunakan '==' (loose equality)
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

  const modulesThisWeek = db.trackings.filter(
    (t) =>
      t.developer_id && // Cek dulu
      t.developer_id == userId && // Baru bandingkan (==)
      t.completed_at &&
      new Date(t.completed_at) >= oneWeekAgo
  ).length;

  const submissions = db.submissions.filter(
    (s) => s.submitter_id && s.submitter_id == userId // Cek dan bandingkan (==)
  ).length;

  const assessments = db.examResults.filter((r) => r.is_passed === '1').length;

  const completedJourneys = db.completions
    .filter((c) => c.user_id && c.user_id == userId) // Cek dan bandingkan (==)
    .map((c) => c.journey_id);

  const learningHours = db.journeys
    .filter((j) => j.id && completedJourneys.includes(j.id)) // .includes() sudah aman
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

  // Cek 'u.id' ADA dan gunakan '=='
  const user = db.users.find((u) => u.id && u.id == userId); // DIUBAH (==)
  
  if (!user) {
    return res.status(404).json({ error: 'User tidak ditemukan' });
  }

  const streakData = calculateStreak(db.trackings, userId);
  res.json(streakData);
};

// GET /api/user/:userId/activity
exports.getActivity = (req, res) => {
  const { userId } = req.params;
  
  // Cek 'u.id' ADA dan gunakan '=='
  const user = db.users.find((u) => u.id && u.id == userId); // DIUBAH (==)

  if (!user) {
    return res.status(404).json({ error: 'User tidak ditemukan' });
  }
  
  const activityData = getActivityStats(userId);
  res.json(activityData);
};

// --- (Sisa file biarkan sama) ---

// GET /api/user/:userId/check-ins
exports.getCheckIns = (req, res) => {
  const { userId } = req.params;
  const checkIns = userCheckIns.get(userId) || [];
  res.json(checkIns);
};

// POST /api/user/:userId/check-ins
exports.addCheckIn = (req, res) => {
  const { userId } = req.params;
  const { date, mood, progress } = req.body;

  if (!date || !mood || !progress) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }

  const checkIns = userCheckIns.get(userId) || [];
  const filteredCheckIns = checkIns.filter((c) => c.date !== date);
  const newCheckIn = { date, mood, progress, status: 'Submitted' };
  filteredCheckIns.push(newCheckIn);
  userCheckIns.set(userId, filteredCheckIns);

  console.log(`Check-in baru untuk ${userId} di ${date}: ${mood}`);
  res.status(201).json(newCheckIn);
};

// GET /api/user/:userId/schedule
exports.getSchedule = (req, res) => {
  const { userId } = req.params;
  const defaultSchedule = {
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: true,
    Friday: true,
    Saturday: true,
    Sunday: false,
  };
  const schedule = userSchedules.get(userId) || defaultSchedule;
  res.json(schedule);
};

// POST /api/user/:userId/schedule
exports.setSchedule = (req, res) => {
  const { userId } = req.params;
  const newSchedule = req.body;

  userSchedules.set(userId, newSchedule);
  console.log(`Jadwal baru untuk ${userId}:`, newSchedule);
  res.status(200).json(newSchedule);
};