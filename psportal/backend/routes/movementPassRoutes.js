const express = require('express');
const router = express.Router();
const movementPassController = require('../controllers/movementPassController');

// In future you may add auth middleware here
router.post('/create', movementPassController.createPass);
router.get('/student/:student_id', movementPassController.getPasses);

module.exports = router;
