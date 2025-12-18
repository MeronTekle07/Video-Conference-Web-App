const db = require('../config/database');
require('dotenv').config();

const cleanupDummyUsers = async () => {
  try {
    console.log('Starting cleanup of dummy users...');

    // List of emails to keep (only admin, remove supervisor)
    const keepEmails = [
      'admin@example.com'
    ];

    // Get all users that should be deleted
    const usersToDelete = await db.query(
      `SELECT id, name, email, role FROM users 
       WHERE email NOT IN (${keepEmails.map((_, i) => `$${i + 1}`).join(', ')})
       AND email LIKE '%@example.com'`,
      keepEmails
    );

    console.log(`Found ${usersToDelete.rows.length} dummy users to delete:`);
    usersToDelete.rows.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ${user.role}`);
    });

    if (usersToDelete.rows.length === 0) {
      console.log('No dummy users found to delete.');
      return;
    }

    // Delete users and their related data (cascading deletes will handle most relationships)
    for (const user of usersToDelete.rows) {
      console.log(`Deleting user: ${user.name} (${user.email})`);
      
      // Delete user (cascading deletes will handle related data)
      await db.query('DELETE FROM users WHERE id = $1', [user.id]);
    }

    // Clean up any orphaned contacts that reference deleted users
    console.log('Cleaning up orphaned contacts...');
    const orphanedContacts = await db.query(
      'DELETE FROM contacts WHERE contact_user_id NOT IN (SELECT id FROM users) RETURNING *'
    );
    console.log(`Removed ${orphanedContacts.rows.length} orphaned contacts`);

    console.log('\n=== Cleanup Summary ===');
    console.log(`Successfully deleted ${usersToDelete.rows.length} dummy users`);
    console.log('\nRemaining users:');
    console.log('- Admin: admin@example.com');
    console.log('- Plus any real registered users');

  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  cleanupDummyUsers().then(() => {
    console.log('Cleanup completed successfully!');
    process.exit(0);
  });
}

module.exports = { cleanupDummyUsers };
