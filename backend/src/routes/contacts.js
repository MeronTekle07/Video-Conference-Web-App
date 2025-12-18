const express = require('express');
const router = express.Router();
const { 
  getUserContacts, 
  addContact, 
  removeContact, 
  toggleFrequentContact, 
  searchUsers 
} = require('../controllers/contactsController');
const { authenticateToken } = require('../middleware/auth');

// Get user contacts
router.get('/', authenticateToken, getUserContacts);

// Search users to add as contacts
router.get('/search', authenticateToken, searchUsers);

// Add contact
router.post('/', authenticateToken, addContact);

// Remove contact
router.delete('/:contactId', authenticateToken, removeContact);

// Toggle frequent contact
router.patch('/:contactId/frequent', authenticateToken, toggleFrequentContact);

module.exports = router;
