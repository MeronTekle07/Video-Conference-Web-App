const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken, loginRateLimit } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Title must be less than 255 characters'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Department must be less than 255 characters'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone must be less than 50 characters')
];

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Title must be less than 255 characters'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Department must be less than 255 characters'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone must be less than 50 characters'),
  body('timezone')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Timezone must be less than 100 characters')
];

// Routes
// POST /api/auth/login
router.post('/login', loginRateLimit, loginValidation, authController.login);

// POST /api/auth/register
router.post('/register', registerValidation, authController.register);

// POST /api/auth/refresh
router.post('/refresh', refreshTokenValidation, authController.refreshToken);

// POST /api/auth/logout
router.post('/logout', authenticateToken, authController.logout);

// GET /api/auth/profile
router.get('/profile', authenticateToken, authController.getProfile);

// PUT /api/auth/profile
router.put('/profile', authenticateToken, updateProfileValidation, authController.updateProfile);

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, changePasswordValidation, authController.changePassword);

module.exports = router; 