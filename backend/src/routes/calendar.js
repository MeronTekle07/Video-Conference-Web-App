const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent
} = require('../controllers/calendarController');

// Get calendar events
router.get('/events', authenticateToken, getCalendarEvents);

// Create calendar event
router.post('/events', 
  authenticateToken,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('eventType').isIn(['meeting', 'reminder', 'task']).withMessage('Invalid event type'),
    body('startTime').isISO8601().withMessage('Valid start time is required'),
    body('endTime').optional().isISO8601().withMessage('Valid end time required if provided'),
    body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid color format'),
    body('attendees').optional().isArray().withMessage('Attendees must be an array')
  ],
  createCalendarEvent
);

// Update calendar event
router.put('/events/:id',
  authenticateToken,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('eventType').isIn(['meeting', 'reminder', 'task']).withMessage('Invalid event type'),
    body('startTime').isISO8601().withMessage('Valid start time is required'),
    body('endTime').optional().isISO8601().withMessage('Valid end time required if provided'),
    body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid color format'),
    body('attendees').optional().isArray().withMessage('Attendees must be an array')
  ],
  updateCalendarEvent
);

// Delete calendar event
router.delete('/events/:id', authenticateToken, deleteCalendarEvent);

module.exports = router;
