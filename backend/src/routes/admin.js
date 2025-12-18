const express = require('express');
const router = express.Router();
const { getAdminStats, getSystemAlerts, getRecentActivity, getMeetingStats, getAnalytics } = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get admin dashboard statistics
router.get('/stats', authenticateToken, requireRole(['admin']), getAdminStats);

// Get system alerts
router.get('/alerts', authenticateToken, requireRole(['admin']), getSystemAlerts);

// Get recent activity
router.get('/activity', authenticateToken, requireRole(['admin']), getRecentActivity);

// Get meeting statistics
router.get('/meeting-stats', authenticateToken, requireRole(['admin']), getMeetingStats);

// Get analytics data
router.get('/analytics', authenticateToken, requireRole(['admin']), getAnalytics);

module.exports = router;
