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
  },
  {
    name: 'Super Admin',
    email: 'superadmin@example.com',
    password: 'password',
    role: 'admin',
    title: 'Global Administrator',
    department: 'Executive',
    phone: '+1 (555) 000-0000'
  },
  // Supervisor users
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    password: 'password',
    role: 'supervisor',
    title: 'Team Lead',
    department: 'Engineering',
    phone: '+1 (555) 234-5678'
  },
  {
    name: 'Mike Chen',
    email: 'mike.chen@example.com',
    password: 'password',
    role: 'supervisor',
    title: 'Project Manager',
    department: 'Product',
    phone: '+1 (555) 345-6789'
  },
  {
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    password: 'password',
    role: 'supervisor',
    title: 'Operations Manager',
    department: 'Operations',
    phone: '+1 (555) 456-7890'
  },
  // Auditor users
  {
    name: 'Alex Wilson',
    email: 'alex.wilson@example.com',
    password: 'password',
    role: 'auditor',
    title: 'Compliance Officer',
    department: 'Legal',
    phone: '+1 (555) 567-8901'
  },
  {
    name: 'Lisa Brown',
    email: 'lisa.brown@example.com',
    password: 'password',
    role: 'auditor',
    title: 'Security Auditor',
    department: 'Security',
    phone: '+1 (555) 678-9012'
  },
  // Regular Users
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'password',
    role: 'user',
    title: 'Software Engineer',
    department: 'Engineering',
    phone: '+1 (555) 789-0123'
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    password: 'password',
    role: 'user',
    title: 'UX Designer',
    department: 'Design',
    phone: '+1 (555) 890-1234'
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