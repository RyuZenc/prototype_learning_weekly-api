const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Rute untuk user 96989 (sesuai data CSV Anda)
// Anda bisa ganti :userId agar lebih dinamis

// GET Streak Card
router.get('/user/:userId/streak', userController.getStreak);

// GET Progress Card
router.get('/user/:userId/progress', userController.getProgress);

// GET Activity Card
router.get('/user/:userId/activity', userController.getActivity);

// GET & POST Daily Check-in
router.get('/user/:userId/check-ins', userController.getCheckIns);
router.post('/user/:userId/check-ins', userController.addCheckIn);

// GET & POST Schedule Modal
router.get('/user/:userId/schedule', userController.getSchedule);
router.post('/user/:userId/schedule', userController.setSchedule);

module.exports = router;