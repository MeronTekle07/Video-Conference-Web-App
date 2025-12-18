const { validationResult } = require('express-validator');
const db = require('../config/database');
const { logSecurityEvent } = require('../middleware/auth');

// Get all meetings for a user (hosted and participated)
const getMyMeetings = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT 
        m.id, m.title, m.description, m.meeting_code, m.start_time, m.end_time,
        m.duration, m.is_recurring, m.recurrence_pattern, m.status, m.recording_url,
        m.created_at, m.updated_at,
        u.name as host_name, u.email as host_email,
        COUNT(mp.id) as participants_count
       FROM meetings m
       LEFT JOIN users u ON m.host_id = u.id
       LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id
       WHERE m.host_id = $1 OR m.id IN (
         SELECT meeting_id FROM meeting_participants WHERE user_id = $1
       )
       GROUP BY m.id, u.name, u.email
       ORDER BY m.start_time DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        meetings: result.rows
      }
    });
  } catch (error) {
    console.error('Get my meetings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get meeting by ID
const getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get meeting details
    const meetingResult = await db.query(
      `SELECT 
        m.id, m.title, m.description, m.meeting_code, m.start_time, m.end_time,
        m.duration, m.is_recurring, m.recurrence_pattern, m.status, m.recording_url,
        m.created_at, m.updated_at,
        u.name as host_name, u.email as host_email
       FROM meetings m
       LEFT JOIN users u ON m.host_id = u.id
       WHERE m.id = $1`,
      [id]
    );

    if (meetingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    const meeting = meetingResult.rows[0];

    // Check if user has access to this meeting
    const accessResult = await db.query(
      `SELECT 1 FROM meetings WHERE id = $1 AND host_id = $2
       UNION
       SELECT 1 FROM meeting_participants WHERE meeting_id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (accessResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get participants
    const participantsResult = await db.query(
      `SELECT 
        u.id, u.name, u.email, u.role, u.title, u.department,
        mp.status as participation_status, mp.joined_at, mp.left_at
       FROM meeting_participants mp
       LEFT JOIN users u ON mp.user_id = u.id
       WHERE mp.meeting_id = $1
       ORDER BY mp.joined_at ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        meeting: {
          ...meeting,
          participants: participantsResult.rows
        }
      }
    });
  } catch (error) {
    console.error('Get meeting by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create new meeting
const createMeeting = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      startTime,
      endTime,
      duration,
      isRecurring,
      recurringPattern,
      participants
    } = req.body;

    const hostId = req.user.id;

    // Generate unique meeting code
    const meetingCode = generateMeetingCode();

    // Prepare recurrence pattern JSONB
    const recurrencePatternJson = recurringPattern
      ? JSON.stringify({ frequency: recurringPattern })
      : null;

    // Create meeting
    const meetingResult = await db.query(
      `INSERT INTO meetings (
        title, description, meeting_code, host_id, start_time, end_time,
        duration, is_recurring, recurrence_pattern, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, title, description, meeting_code, start_time, end_time,
                duration, is_recurring, recurrence_pattern, status, created_at`,
      [title, description, meetingCode, hostId, startTime, endTime || null, duration, !!isRecurring, recurrencePatternJson, 'scheduled']
    );

    const newMeeting = meetingResult.rows[0];

    // Add participants if provided
    if (participants && participants.length > 0) {
      const participantValues = participants.map((participantId, index) => {
        const offset = index * 2;
        return `($${offset + 1}, $${offset + 2})`;
      }).join(', ');

      const participantParams = participants.flatMap(participantId => [newMeeting.id, participantId]);

      await db.query(
        `INSERT INTO meeting_participants (meeting_id, user_id, status)
         VALUES ${participantValues}`,
        participantParams
      );
    }

    // Log the action
    await logSecurityEvent(hostId, 'meeting_created', `Created meeting: ${title}`, 'low');

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      data: {
        meeting: newMeeting
      }
    });

  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update meeting
const updateMeeting = async (req, res) => {
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
    const {
      title,
      description,
      startTime,
      endTime,
      duration,
      isRecurring,
      recurringPattern,
      status
    } = req.body;

    const userId = req.user.id;

    // Check if user is the host of this meeting
    const meetingCheck = await db.query(
      'SELECT id, title FROM meetings WHERE id = $1 AND host_id = $2',
      [id, userId]
    );

    if (meetingCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only the meeting host can update this meeting'
      });
    }

    // Prepare recurrence pattern JSONB
    const recurrencePatternJson = typeof recurringPattern !== 'undefined'
      ? (recurringPattern ? JSON.stringify({ frequency: recurringPattern }) : null)
      : undefined;

    // Update meeting
    const result = await db.query(
      `UPDATE meetings 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           start_time = COALESCE($3, start_time),
           end_time = COALESCE($4, end_time),
           duration = COALESCE($5, duration),
           is_recurring = COALESCE($6, is_recurring),
           recurrence_pattern = COALESCE($7, recurrence_pattern),
           status = COALESCE($8, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING id, title, description, meeting_code, start_time, end_time,
                 duration, is_recurring, recurrence_pattern, status, updated_at`,
      [title, description, startTime, endTime || null, duration, isRecurring, recurrencePatternJson, status, id]
    );

    const updatedMeeting = result.rows[0];

    // Log the action
    await logSecurityEvent(userId, 'meeting_updated', `Updated meeting: ${updatedMeeting.title}`, 'low');

    res.json({
      success: true,
      message: 'Meeting updated successfully',
      data: {
        meeting: updatedMeeting
      }
    });

  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete meeting
const deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is the host of this meeting
    const meetingCheck = await db.query(
      'SELECT id, title FROM meetings WHERE id = $1 AND host_id = $2',
      [id, userId]
    );

    if (meetingCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only the meeting host can delete this meeting'
      });
    }

    // Delete meeting (cascade will handle participants)
    await db.query('DELETE FROM meetings WHERE id = $1', [id]);

    // Log the action
    await logSecurityEvent(userId, 'meeting_deleted', `Deleted meeting: ${meetingCheck.rows[0].title}`, 'medium');

    res.json({
      success: true,
      message: 'Meeting deleted successfully'
    });

  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Join meeting
const joinMeeting = async (req, res) => {
  try {
    const { meetingCode } = req.body;
    const userId = req.user.id;

    // Find meeting by code
    const meetingResult = await db.query(
      'SELECT id, title, status FROM meetings WHERE meeting_code = $1',
      [meetingCode]
    );

    if (meetingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    const meeting = meetingResult.rows[0];

    if (meeting.status === 'ended') {
      return res.status(400).json({
        success: false,
        message: 'This meeting has ended'
      });
    }

    // Check if user is already a participant
    const participantCheck = await db.query(
      'SELECT id FROM meeting_participants WHERE meeting_id = $1 AND user_id = $2',
      [meeting.id, userId]
    );

    if (participantCheck.rows.length === 0) {
      // Add user as participant
      await db.query(
        'INSERT INTO meeting_participants (meeting_id, user_id, status) VALUES ($1, $2, $3)',
        [meeting.id, userId, 'joined']
      );
    } else {
      // Update existing participation
      await db.query(
        'UPDATE meeting_participants SET status = $1, joined_at = CURRENT_TIMESTAMP WHERE meeting_id = $2 AND user_id = $3',
        ['joined', meeting.id, userId]
      );
    }

    // Log the action
    await logSecurityEvent(userId, 'meeting_joined', `Joined meeting: ${meeting.title}`, 'low');

    res.json({
      success: true,
      message: 'Successfully joined meeting',
      data: {
        meetingId: meeting.id,
        meetingTitle: meeting.title
      }
    });

  } catch (error) {
    console.error('Join meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Leave meeting
const leaveMeeting = async (req, res) => {
  try {
    const { meetingId } = req.body;
    const userId = req.user.id;

    // Update participation status
    await db.query(
      'UPDATE meeting_participants SET status = $1, left_at = CURRENT_TIMESTAMP WHERE meeting_id = $2 AND user_id = $3',
      ['left', meetingId, userId]
    );

    // Log the action
    await logSecurityEvent(userId, 'meeting_left', `Left meeting ID: ${meetingId}`, 'low');

    res.json({
      success: true,
      message: 'Successfully left meeting'
    });

  } catch (error) {
    console.error('Leave meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Helper function to generate unique meeting code
const generateMeetingCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

module.exports = {
  getMyMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  joinMeeting,
  leaveMeeting
}; 