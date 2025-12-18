const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const createUserValidation = [
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
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn(['user', 'admin', 'supervisor', 'auditor'])
    .withMessage('Invalid role'),
  body('status')
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Invalid status'),
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

const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('role')
    .optional()
    .isIn(['user', 'admin', 'supervisor', 'auditor'])
    .withMessage('Invalid role'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Invalid status'),
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

const changePasswordValidation = [
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

// Routes - All require authentication and admin privileges
router.use(authenticateToken, requireAdmin);

// GET /api/users - Get all users
router.get('/', userController.getAllUsers);

// GET /api/users/stats - Get user statistics
router.get('/stats', userController.getUserStats);

// GET /api/users/:id - Get user by ID
router.get('/:id', userController.getUserById);

// POST /api/users - Create new user
router.post('/', createUserValidation, userController.createUser);

// PUT /api/users/:id - Update user
router.put('/:id', updateUserValidation, userController.updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', userController.deleteUser);

// POST /api/users/:id/change-password - Change user password
router.post('/:id/change-password', changePasswordValidation, userController.changeUserPassword);

module.exports = router; 