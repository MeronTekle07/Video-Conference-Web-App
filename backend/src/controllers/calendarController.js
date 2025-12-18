const { validationResult } = require('express-validator');

// Get calendar events for a user
async function getCalendarEvents(req, res) {
  try {
    const db = require('../config/database');
    const userId = req.user.id;

    const result = await db.query(`
      SELECT 
        id,
        title,
        description,
        event_type,
        start_time,
        end_time,
        color,
        attendees,
        created_at
      FROM calendar_events 
      WHERE user_id = $1 
      ORDER BY start_time ASC
    `, [userId]);

    res.json({
      success: true,
      events: result.rows
    });

  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

// Create calendar event
async function createCalendarEvent(req, res) {
  try {
    const db = require('../config/database');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description, eventType, startTime, endTime, color, attendees } = req.body;
    const userId = req.user.id;

    console.log('Creating calendar event with data:', {
      userId, title, description, eventType, startTime, endTime, color, attendees
    });

    const result = await db.query(`
      INSERT INTO calendar_events (user_id, title, description, event_type, start_time, end_time, color, attendees)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [userId, title, description, eventType, startTime, endTime, color, JSON.stringify(attendees || [])]);

    const event = result.rows[0];
    console.log('Calendar event created successfully:', event);

    res.json({
      success: true,
      message: 'Calendar event created successfully',
      event
    });

  } catch (error) {
    console.error('Create calendar event error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

// Update calendar event
async function updateCalendarEvent(req, res) {
  try {
    const db = require('../config/database');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { title, description, eventType, startTime, endTime, color, attendees } = req.body;
    const userId = req.user.id;

    // Check if event belongs to user
    const eventCheck = await db.query(
      'SELECT id FROM calendar_events WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Calendar event not found'
      });
    }

    const result = await db.query(`
      UPDATE calendar_events 
      SET title = $1, description = $2, event_type = $3, start_time = $4, 
          end_time = $5, color = $6, attendees = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8 AND user_id = $9
      RETURNING *
    `, [title, description, eventType, startTime, endTime, color, JSON.stringify(attendees || []), id, userId]);

    const event = result.rows[0];

    res.json({
      success: true,
      message: 'Calendar event updated successfully',
      event
    });

  } catch (error) {
    console.error('Update calendar event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

// Delete calendar event
async function deleteCalendarEvent(req, res) {
  try {
    const db = require('../config/database');
    const { id } = req.params;
    const userId = req.user.id;

    // Check if event belongs to user
    const eventCheck = await db.query(
      'SELECT id FROM calendar_events WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Calendar event not found'
      });
    }

    await db.query('DELETE FROM calendar_events WHERE id = $1 AND user_id = $2', [id, userId]);

    res.json({
      success: true,
      message: 'Calendar event deleted successfully'
    });

  } catch (error) {
    console.error('Delete calendar event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

module.exports = {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent
};
