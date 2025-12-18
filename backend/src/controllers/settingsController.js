const db = require('../config/database');

// Get user settings
const getUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Create default settings if none exist
      const defaultSettings = {
        notifications: {
          meetingReminders: true,
          emailNotifications: true,
          desktopNotifications: true,
          soundNotifications: true,
          meetingInvites: true
        },
        privacy: {
          profileVisibility: 'team',
          showOnlineStatus: true,
          allowDirectMessages: true,
          shareCalendar: false
        },
        meeting_preferences: {
          defaultCamera: true,
          defaultMicrophone: false,
          autoJoinAudio: true,
          enableWaitingRoom: true,
          recordMeetings: false,
          backgroundBlur: false
        },
        appearance: {
          theme: 'dark',
          language: 'en',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h'
        }
      };

      const insertResult = await db.query(
        `INSERT INTO user_settings (user_id, notifications, privacy, meeting_preferences, appearance) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [userId, defaultSettings.notifications, defaultSettings.privacy, 
         defaultSettings.meeting_preferences, defaultSettings.appearance]
      );

      return res.json({
        success: true,
        settings: insertResult.rows[0]
      });
    }

    res.json({
      success: true,
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settings'
    });
  }
};

// Update user settings
const updateUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notifications, privacy, meeting_preferences, appearance } = req.body;

    const result = await db.query(
      `UPDATE user_settings 
       SET notifications = $2, privacy = $3, meeting_preferences = $4, appearance = $5, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 
       RETURNING *`,
      [userId, notifications, privacy, meeting_preferences, appearance]
    );

    if (result.rows.length === 0) {
      // Create new settings if none exist
      const insertResult = await db.query(
        `INSERT INTO user_settings (user_id, notifications, privacy, meeting_preferences, appearance) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [userId, notifications, privacy, meeting_preferences, appearance]
      );

      return res.json({
        success: true,
        settings: insertResult.rows[0]
      });
    }

    res.json({
      success: true,
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
};

module.exports = {
  getUserSettings,
  updateUserSettings
};
