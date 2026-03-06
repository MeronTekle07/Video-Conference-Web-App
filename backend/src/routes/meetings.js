const express = require('express');
const { body } = require('express-validator');
const meetingController = require('../controllers/meetingController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const createMeetingValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title is required and must be less than 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('startTime')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),
  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date'),
  body('duration')
    .isInt({ min: 1, max: 480 })
    .withMessage('Duration must be between 1 and 480 minutes'),
  body('isRecurring')
    .optional()
    .isBoolean()
    .withMessage('isRecurring must be a boolean'),
  body('recurringPattern')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Recurring pattern must be daily, weekly, or monthly'),
  body('participants')
    .optional()
    .isArray()
    .withMessage('Participants must be an array'),
  body('participants.*')
    .optional()
    .isUUID()
    .withMessage('Each participant must be a valid UUID')
];

const updateMeetingValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be less than 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('startTime')
    .optional()
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),
  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date'),
  body('duration')
    .optional()
    .isInt({ min: 1, max: 480 })
    .withMessage('Duration must be between 1 and 480 minutes'),
  body('isRecurring')
    .optional()
    .isBoolean()
    .withMessage('isRecurring must be a boolean'),
  body('recurringPattern')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Recurring pattern must be daily, weekly, or monthly'),
  body('status')
    .optional()
    .isIn(['scheduled', 'live', 'ended', 'cancelled'])
    .withMessage('Status must be scheduled, live, ended, or cancelled')
];

const joinMeetingValidation = [
  body('meetingCode')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Meeting code is required')
];

const leaveMeetingValidation = [
  body('meetingId')
    .isUUID()
    .withMessage('Meeting ID must be a valid UUID')
];

// All routes require authentication
router.use(authenticateToken);

// GET /api/meetings/my - Get all meetings for the authenticated user
router.get('/my', meetingController.getMyMeetings);

// GET /api/meetings/:id - Get meeting by ID
router.get('/:id', meetingController.getMeetingById);

// POST /api/meetings - Create new meeting
router.post('/', createMeetingValidation, meetingController.createMeeting);

// PUT /api/meetings/:id - Update meeting
router.put('/:id', updateMeetingValidation, meetingController.updateMeeting);

// DELETE /api/meetings/:id - Delete meeting
router.delete('/:id', meetingController.deleteMeeting);

// POST /api/meetings/join - Join meeting by code
router.post('/join', joinMeetingValidation, meetingController.joinMeeting);

// POST /api/meetings/leave - Leave meeting
router.post('/leave', leaveMeetingValidation, meetingController.leaveMeeting);

module.exports = router; 