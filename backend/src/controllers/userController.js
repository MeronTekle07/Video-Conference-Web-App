const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const db = require('../config/database');
const { logSecurityEvent } = require('../middleware/auth');

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        u.id, u.name, u.email, u.role, u.status, u.title, u.department, 
        u.phone, u.timezone, u.last_login, u.created_at,
        COUNT(mp.id) as meetings_attended
       FROM users u
       LEFT JOIN meeting_participants mp ON u.id = mp.user_id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );

    res.json({
      success: true,
      data: {
        users: result.rows
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT id, name, email, role, status, title, department, phone, timezone, last_login, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create new user (admin only)
const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, role, status, title, department, phone } = req.body;
    const adminId = req.user.id;

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
      `INSERT INTO users (name, email, password_hash, role, status, title, department, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, email, role, status, title, department, phone, created_at`,
      [name, email, passwordHash, role, status, title, department, phone]
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

    // Log the action
    await logSecurityEvent(adminId, 'permission_change', `Admin created new user: ${email} with role: ${role}`, 'medium');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: newUser
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user (admin only)
const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { name, email, role, status, title, department, phone, timezone } = req.body;
    const adminId = req.user.id;

    // Check if user exists
    const existingUser = await db.query(
      'SELECT id, email FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingUser.rows[0].email) {
      const emailCheck = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, id]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email is already taken by another user'
        });
      }
    }

    // Update user
    const result = await db.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           role = COALESCE($3, role),
           status = COALESCE($4, status),
           title = COALESCE($5, title),
           department = COALESCE($6, department),
           phone = COALESCE($7, phone),
           timezone = COALESCE($8, timezone),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING id, name, email, role, status, title, department, phone, timezone, last_login, created_at`,
      [name, email, role, status, title, department, phone, timezone, id]
    );

    const updatedUser = result.rows[0];

    // Log the action
    await logSecurityEvent(adminId, 'permission_change', `Admin updated user: ${updatedUser.email}`, 'medium');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Check if user exists
    const existingUser = await db.query(
      'SELECT id, email FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (id === adminId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Delete user (cascade will handle related records)
    await db.query('DELETE FROM users WHERE id = $1', [id]);

    // Log the action
    await logSecurityEvent(adminId, 'permission_change', `Admin deleted user: ${existingUser.rows[0].email}`, 'high');

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Change user password (admin only)
const changeUserPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { newPassword } = req.body;
    const adminId = req.user.id;

    // Check if user exists
    const existingUser = await db.query(
      'SELECT id, email FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, id]
    );

    // Log the action
    await logSecurityEvent(adminId, 'password_change', `Admin changed password for user: ${existingUser.rows[0].email}`, 'medium');

    res.json({
      success: true,
      message: 'User password changed successfully'
    });

  } catch (error) {
    console.error('Change user password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    // Get user counts by status
    const statusStats = await db.query(
      `SELECT 
        status,
        COUNT(*) as count
       FROM users 
       GROUP BY status`
    );

    // Get user counts by role
    const roleStats = await db.query(
      `SELECT 
        role,
        COUNT(*) as count
       FROM users 
       GROUP BY role`
    );

    // Get total meetings attended
    const meetingStats = await db.query(
      `SELECT 
        COUNT(DISTINCT mp.user_id) as users_with_meetings,
        COUNT(mp.id) as total_meetings_attended
       FROM meeting_participants mp`
    );

    // Get recent activity
    const recentActivity = await db.query(
      `SELECT 
        COUNT(*) as recent_logins
       FROM users 
       WHERE last_login > NOW() - INTERVAL '7 days'`
    );

    const stats = {
      byStatus: statusStats.rows,
      byRole: roleStats.rows,
      meetings: meetingStats.rows[0],
      recentActivity: recentActivity.rows[0]
    };

    res.json({
      success: true,
      data: {
        stats
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changeUserPassword,
  getUserStats
}; 