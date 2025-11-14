// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Rute untuk user 96989 (sesuai data CSV Anda)
// Anda bisa ganti :userId agar lebih dinamis

// GET Streak Card
router.get('/user/:userId/streak', userController.getStreak);

// GET Activity Card
router.get('/user/:userId/activity', userController.getActivity);

// GET & POST Daily Check-in
router.get('/user/:userId/check-ins', userController.getCheckIns);
router.post('/user/:userId/check-ins', userController.addCheckIn);

// GET & POST Schedule Modal
router.get('/user/:userId/schedule', userController.getSchedule);
router.post('/user/:userId/schedule', userController.setSchedule);

// GET & POST Learning Target
router.get('/user/:userId/target', userController.getTarget);
router.post('/user/:userId/target', userController.setTarget);

module.exports = router;