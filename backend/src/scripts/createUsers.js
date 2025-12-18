const bcrypt = require('bcryptjs');
const db = require('../config/database');
require('dotenv').config();

const users = [
  // Admin users
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password',
    role: 'admin',
    title: 'System Administrator',
    department: 'IT',
    phone: '+1 (555) 123-4567'
  }
];

const createUsers = async () => {
  try {
    console.log('Starting user creation...');

    for (const userData of users) {
      // Check if user already exists
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [userData.email]
      );

      if (existingUser.rows.length > 0) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      // Insert user
      const result = await db.query(
        `INSERT INTO users (name, email, password_hash, role, title, department, phone, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, name, email, role`,
        [
          userData.name,
          userData.email,
          passwordHash,
          userData.role,
          userData.title,
          userData.department,
          userData.phone,
          'active'
        ]
      );

      const user = result.rows[0];
      console.log(`Created user: ${user.name} (${user.email}) - Role: ${user.role}`);

      // Create default user settings
      await db.query(
        `INSERT INTO user_settings (user_id, notifications, privacy, meeting_preferences, appearance)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          user.id,
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
    }

    console.log('\n=== User Creation Summary ===');
    console.log('All users created successfully!');
    console.log('\nDemo Credentials:');
    console.log('Admin: admin@example.com / password');
    console.log('\nTotal users created:', users.length);

  } catch (error) {
    console.error('Error creating users:', error);
    process.exit(1);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  createUsers().then(() => {
    process.exit(0);
  });
}

module.exports = { createUsers }; 