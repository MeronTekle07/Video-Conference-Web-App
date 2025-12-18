const db = require('../config/database');

const createTables = async () => {
  try {
    console.log('Starting database migration...');

    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'supervisor', 'auditor')),
        status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        avatar_url TEXT,
        title VARCHAR(255),
        department VARCHAR(255),
        phone VARCHAR(50),
        timezone VARCHAR(100) DEFAULT 'America/New_York',
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create meetings table
    await db.query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        host_id UUID REFERENCES users(id) ON DELETE CASCADE,
        meeting_code VARCHAR(50) UNIQUE NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        duration INTEGER DEFAULT 30,
        max_participants INTEGER DEFAULT 50,
        is_recurring BOOLEAN DEFAULT FALSE,
        recurrence_pattern JSONB,
        is_recording BOOLEAN DEFAULT FALSE,
        recording_url TEXT,
        waiting_room BOOLEAN DEFAULT TRUE,
        status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create meeting_participants table
    await db.query(`
      CREATE TABLE IF NOT EXISTS meeting_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'participant' CHECK (role IN ('host', 'participant', 'admin', 'monitor')),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        left_at TIMESTAMP,
        is_audio_on BOOLEAN DEFAULT FALSE,
        is_video_on BOOLEAN DEFAULT FALSE,
        is_screen_sharing BOOLEAN DEFAULT FALSE,
        is_hand_raised BOOLEAN DEFAULT FALSE,
        is_muted BOOLEAN DEFAULT FALSE,
        has_warning BOOLEAN DEFAULT FALSE,
        UNIQUE(meeting_id, user_id)
      )
    `);

    // Create meeting_chat table
    await db.query(`
      CREATE TABLE IF NOT EXISTS meeting_chat (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        message TEXT NOT NULL,
        message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create admin_actions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_actions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
        admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
        target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('mute', 'unmute', 'remove', 'warn', 'mute_all', 'end_meeting', 'pause_meeting')),
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_settings table
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        notifications JSONB DEFAULT '{}',
        privacy JSONB DEFAULT '{}',
        meeting_preferences JSONB DEFAULT '{}',
        appearance JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create contacts table
    await db.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        contact_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        is_frequent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, contact_user_id)
      )
    `);

    // Create calendar_events table
    await db.query(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_type VARCHAR(50) DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'reminder', 'task')),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        color VARCHAR(7) DEFAULT '#3B82F6',
        attendees JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create security_events table
    await db.query(`
      CREATE TABLE IF NOT EXISTS security_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('login', 'failed_login', 'password_change', 'permission_change', 'data_access', 'suspicious_activity')),
        ip_address INET,
        user_agent TEXT,
        location VARCHAR(255),
        details TEXT,
        severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await db.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_meetings_host_id ON meetings(host_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON meetings(start_time)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting_id ON meeting_participants(meeting_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_meeting_participants_user_id ON meeting_participants(user_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_meeting_chat_meeting_id ON meeting_chat(meeting_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_admin_actions_meeting_id ON admin_actions(meeting_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at)');

    console.log('Database migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  createTables().then(() => {
    process.exit(0);
  });
}

module.exports = { createTables }; 