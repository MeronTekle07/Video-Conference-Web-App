const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/database');
const { logSecurityEvent } = require('../middleware/auth');

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

// Login controller
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;

    // Find user by email
    const userResult = await db.query(
      'SELECT id, name, email, password_hash, role, status FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      await logSecurityEvent(null, 'failed_login', `Failed login attempt for email: ${email}`, 'medium', clientIP);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = userResult.rows[0];

    // Check if user is active
    if (user.status !== 'active') {
      await logSecurityEvent(user.id, 'failed_login', `Login attempt for inactive user: ${email}`, 'high', clientIP);
      return res.status(401).json({
        success: false,
        message: 'Account is not active. Please contact administrator.'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      await logSecurityEvent(user.id, 'failed_login', `Failed login attempt for user: ${email}`, 'medium', clientIP);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login and set status to active
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP, status = $1 WHERE id = $2',
      ['active', user.id]
    );

    // Generate tokens
    const accessToken = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Log successful login
    await logSecurityEvent(user.id, 'login', `Successful login from IP: ${clientIP}`, 'low', clientIP);

    // Return user data (without password) and tokens
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Register controller
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, title, department, phone } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userResult = await db.query(
      `INSERT INTO users (name, email, password_hash, title, department, phone, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, email, role, title, department, phone, status, created_at`,
      [name, email, passwordHash, title, department, phone, 'user', 'active']
    );

    const newUser = userResult.rows[0];

    // Create default user settings
    await db.query(
      `INSERT INTO user_settings (user_id, notifications, privacy, meeting_preferences, appearance)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        newUser.id,
        JSON.stringify({
          meetingReminders: true,
          emailNotifications: true,
          desktopNotifications: false,
          soundNotifications: true,
          meetingInvites: true
        }),
        JSON.stringify({
          profileVisibility: 'team',
          showOnlineStatus: true,
          allowDirectMessages: true,
          shareCalendar: true
        }),
        JSON.stringify({
          defaultCamera: true,
          defaultMicrophone: true,
          autoJoinAudio: true,
          enableWaitingRoom: false,
          recordMeetings: false,
          backgroundBlur: true
        }),
        JSON.stringify({
          theme: 'dark',
          language: 'en',
          fontSize: 'medium',
          compactMode: false
        })
      ]
    );

    // Generate tokens
    const accessToken = generateToken(newUser.id, newUser.role);
    const refreshToken = generateRefreshToken(newUser.id);

    // Log registration
    await logSecurityEvent(newUser.id, 'login', `New user registration from IP: ${clientIP}`, 'low', clientIP);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: newUser,
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Refresh token controller
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Get user from database
    const userResult = await db.query(
      'SELECT id, role, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'User account is not active'
      });
    }

    // Generate new tokens
    const newAccessToken = generateToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired'
      });
    }
    
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Logout controller
const logout = async (req, res) => {
  try {
    const userId = req.user.id;
    const clientIP = req.ip || req.connection.remoteAddress;

    // Log logout event
    await logSecurityEvent(userId, 'login', `User logged out from IP: ${clientIP}`, 'low', clientIP);

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const userResult = await db.query(
      `SELECT id, name, email, role, status, avatar_url, title, department, phone, timezone, last_login, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Get user settings
    const settingsResult = await db.query(
      'SELECT notifications, privacy, meeting_preferences, appearance FROM user_settings WHERE user_id = $1',
      [userId]
    );

    const settings = settingsResult.rows.length > 0 ? settingsResult.rows[0] : {};

    res.json({
      success: true,
      data: {
        user,
        settings
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, title, department, phone, timezone } = req.body;

    const result = await db.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           title = COALESCE($2, title),
           department = COALESCE($3, department),
           phone = COALESCE($4, phone),
           timezone = COALESCE($5, timezone),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, name, email, role, status, avatar_url, title, department, phone, timezone, last_login, created_at`,
      [name, title, department, phone, timezone, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updatedUser = result.rows[0];

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Get current password hash
    const userResult = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    // Log password change
    await logSecurityEvent(userId, 'password_change', 'Password changed successfully', 'medium');

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  login,
  register,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  changePassword
}; 