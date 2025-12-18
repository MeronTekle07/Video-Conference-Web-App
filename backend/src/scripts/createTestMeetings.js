const db = require('../config/database');

const createTestMeetings = async () => {
  try {
    console.log('Creating test meetings for analytics...');

    // Get admin user ID
    const adminResult = await db.query('SELECT id FROM users WHERE email = $1', ['admin@example.com']);
    if (adminResult.rows.length === 0) {
      console.error('Admin user not found. Please run npm run create-users first.');
      return;
    }
    const adminId = adminResult.rows[0].id;

    // Create test meetings with various dates and durations
    const testMeetings = [
      {
        title: 'Weekly Team Standup',
        description: 'Regular team sync meeting',
        duration: 30,
        status: 'completed',
        daysAgo: 1
      },
      {
        title: 'Project Planning Session',
        description: 'Planning for Q4 projects',
        duration: 60,
        status: 'completed',
        daysAgo: 3
      },
      {
        title: 'Client Presentation',
        description: 'Presenting new features to client',
        duration: 45,
        status: 'completed',
        daysAgo: 5
      },
      {
        title: 'Engineering Review',
        description: 'Code review and architecture discussion',
        duration: 90,
        status: 'completed',
        daysAgo: 7
      },
      {
        title: 'Marketing Strategy',
        description: 'Discussing marketing campaigns',
        duration: 40,
        status: 'completed',
        daysAgo: 10
      },
      {
        title: 'Product Demo',
        description: 'Internal product demonstration',
        duration: 25,
        status: 'completed',
        daysAgo: 12
      },
      {
        title: 'Budget Review',
        description: 'Quarterly budget analysis',
        duration: 75,
        status: 'completed',
        daysAgo: 15
      },
      {
        title: 'Training Session',
        description: 'New employee onboarding',
        duration: 120,
        status: 'completed',
        daysAgo: 18
      },
      {
        title: 'Customer Feedback',
        description: 'Reviewing customer feedback and suggestions',
        duration: 35,
        status: 'completed',
        daysAgo: 20
      },
      {
        title: 'Sprint Retrospective',
        description: 'Agile sprint retrospective meeting',
        duration: 50,
        status: 'completed',
        daysAgo: 22
      }
    ];

    let createdCount = 0;

    for (const meeting of testMeetings) {
      const startTime = new Date();
      startTime.setDate(startTime.getDate() - meeting.daysAgo);
      startTime.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0); // Random hour between 9 AM and 5 PM

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + meeting.duration);

      const meetingCode = `MTG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

      await db.query(`
        INSERT INTO meetings (
          title, description, host_id, meeting_code, start_time, end_time, 
          duration, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        meeting.title,
        meeting.description,
        adminId,
        meetingCode,
        startTime,
        endTime,
        meeting.duration,
        meeting.status,
        startTime
      ]);

      createdCount++;
    }

    // Create some calendar events too
    const calendarEvents = [
      {
        title: 'Board Meeting',
        eventType: 'meeting',
        daysFromNow: 5,
        duration: 120
      },
      {
        title: 'Team Building Event',
        eventType: 'meeting',
        daysFromNow: 10,
        duration: 180
      },
      {
        title: 'Quarterly Review',
        eventType: 'meeting',
        daysFromNow: 15,
        duration: 90
      }
    ];

    for (const event of calendarEvents) {
      const startTime = new Date();
      startTime.setDate(startTime.getDate() + event.daysFromNow);
      startTime.setHours(14, 0, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + event.duration);

      await db.query(`
        INSERT INTO calendar_events (
          user_id, title, event_type, start_time, end_time, color
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        adminId,
        event.title,
        event.eventType,
        startTime,
        endTime,
        '#3B82F6'
      ]);
    }

    console.log(`✅ Created ${createdCount} test meetings and ${calendarEvents.length} calendar events`);
    console.log('🎉 Analytics data is now available!');
    
  } catch (error) {
    console.error('Error creating test meetings:', error);
  } finally {
    process.exit(0);
  }
};

createTestMeetings();
