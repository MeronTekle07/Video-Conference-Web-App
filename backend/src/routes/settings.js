const express = require('express');
const router = express.Router();
const { getUserSettings, updateUserSettings } = require('../controllers/settingsController');
const { authenticateToken } = require('../middleware/auth');

// Get user settings
router.get('/', authenticateToken, getUserSettings);

// Update user settings
router.put('/', authenticateToken, updateUserSettings);

module.exports = router;
