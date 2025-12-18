const db = require('../config/database');

// Get user contacts
const getUserContacts = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(
      `SELECT c.*, u.name, u.email, u.avatar_url, u.title, u.department, u.status
       FROM contacts c
       JOIN users u ON c.contact_user_id = u.id
       WHERE c.user_id = $1
       ORDER BY c.is_frequent DESC, u.name ASC`,
      [userId]
    );

    res.json({
      success: true,
      contacts: result.rows
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get contacts'
    });
  }
};

// Add contact
const addContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contactUserId } = req.body;

    // Check if contact already exists
    const existingContact = await db.query(
      'SELECT id FROM contacts WHERE user_id = $1 AND contact_user_id = $2',
      [userId, contactUserId]
    );

    if (existingContact.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Contact already exists'
      });
    }

    // Verify the contact user exists
    const userExists = await db.query(
      'SELECT id FROM users WHERE id = $1',
      [contactUserId]
    );

    if (userExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const result = await db.query(
      'INSERT INTO contacts (user_id, contact_user_id) VALUES ($1, $2) RETURNING *',
      [userId, contactUserId]
    );

    res.json({
      success: true,
      contact: result.rows[0]
    });
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add contact'
    });
  }
};

// Remove contact
const removeContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contactId } = req.params;

    const result = await db.query(
      'DELETE FROM contacts WHERE id = $1 AND user_id = $2 RETURNING *',
      [contactId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact removed successfully'
    });
  } catch (error) {
    console.error('Remove contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove contact'
    });
  }
};

// Toggle frequent contact
const toggleFrequentContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contactId } = req.params;

    const result = await db.query(
      `UPDATE contacts 
       SET is_frequent = NOT is_frequent 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [contactId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      contact: result.rows[0]
    });
  } catch (error) {
    console.error('Toggle frequent contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact'
    });
  }
};

// Search users to add as contacts
const searchUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.avatar_url, u.title, u.department, u.status
       FROM users u
       WHERE u.id != $1 
       AND u.status = 'active'
       AND (u.name ILIKE $2 OR u.email ILIKE $2)
       AND u.id NOT IN (
         SELECT contact_user_id FROM contacts WHERE user_id = $1
       )
       ORDER BY u.name ASC
       LIMIT 20`,
      [userId, `%${query}%`]
    );

    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users'
    });
  }
};

module.exports = {
  getUserContacts,
  addContact,
  removeContact,
  toggleFrequentContact,
  searchUsers
};
