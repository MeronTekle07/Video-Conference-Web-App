const db = require('../config/database');

const resetDatabase = async () => {
  try {
    console.log('Starting database reset...');

    // Drop all tables in the correct order (respecting foreign key constraints)
    const tables = [
      'security_events',
      'calendar_events',
      'contacts',
      'user_settings',
      'admin_actions',
      'meeting_chat',
      'meeting_participants',
      'meetings',
      'users'
    ];

    for (const table of tables) {
      try {
        await db.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`Dropped table: ${table}`);
      } catch (error) {
        console.log(`Error dropping table ${table}:`, error.message);
      }
    }

    console.log('Database reset completed successfully!');
    console.log('Run "npm run db:migrate" to recreate tables');
    console.log('Run "npm run create-users" to create demo users');

  } catch (error) {
    console.error('Database reset failed:', error);
    process.exit(1);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  resetDatabase().then(() => {
    process.exit(0);
  });
}

module.exports = { resetDatabase }; 