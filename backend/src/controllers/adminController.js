const db = require('../config/database');
const os = require('os');

// Get admin dashboard statistics
const getAdminStats = async (req, res) => {
  try {
    // Get total users count
    const totalUsersResult = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE status = $1',
      ['active']
    );
    const totalUsers = parseInt(totalUsersResult.rows[0].count);

    // Get active users (logged in within last 24 hours)
    const activeUsersResult = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE last_login > NOW() - INTERVAL \'24 hours\' AND status = $1',
      ['active']
    );
    const activeUsers = parseInt(activeUsersResult.rows[0].count);

    // Get live meetings count
    const liveMeetingsResult = await db.query(
      'SELECT COUNT(*) as count FROM meetings WHERE status = $1',
      ['live']
    );
    const liveMeetings = parseInt(liveMeetingsResult.rows[0].count);

    // Get total meetings today
    const todayMeetingsResult = await db.query(
      'SELECT COUNT(*) as count FROM meetings WHERE DATE(start_time) = CURRENT_DATE'
    );
    const todayMeetings = parseInt(todayMeetingsResult.rows[0].count);

    // Get system health metrics
    const systemHealth = getSystemHealth();

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        liveMeetings,
        todayMeetings,
        systemHealth
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin statistics'
    });
  }
};

// Get system health metrics
const getSystemHealth = () => {
  const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;
  const memoryUsage = (1 - (os.freemem() / os.totalmem())) * 100;
  const uptime = os.uptime();

  // Calculate health status
  let status = 'good';
  if (cpuUsage > 80 || memoryUsage > 85) {
    status = 'critical';
  } else if (cpuUsage > 60 || memoryUsage > 70) {
    status = 'warning';
  }

  return {
    status,
    cpuUsage: Math.round(cpuUsage * 100) / 100,
    memoryUsage: Math.round(memoryUsage * 100) / 100,
    uptime: Math.round(uptime),
    serverLoad: Math.round(cpuUsage)
  };
};

// Get recent system alerts
const getSystemAlerts = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM security_events 
       WHERE severity IN ('medium', 'high', 'critical')
       ORDER BY created_at DESC 
       LIMIT 10`
    );

    const alerts = result.rows.map(event => ({
      id: event.id,
      type: event.severity === 'critical' ? 'error' : event.severity === 'high' ? 'warning' : 'info',
      message: event.details || `${event.event_type} event detected`,
      time: getRelativeTime(new Date(event.created_at)),
      severity: event.severity
    }));

    res.json({
      success: true,
      alerts
    });
  } catch (error) {
    console.error('Get system alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system alerts'
    });
  }
};

// Get recent user activity
const getRecentActivity = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.name, u.email, se.event_type, se.created_at, se.ip_address
       FROM security_events se
       JOIN users u ON se.user_id = u.id
       WHERE se.event_type IN ('login', 'password_change', 'permission_change')
       ORDER BY se.created_at DESC
       LIMIT 20`
    );

    const activities = result.rows.map(activity => ({
      id: activity.created_at,
      user: activity.name,
      email: activity.email,
      action: formatEventType(activity.event_type),
      time: getRelativeTime(new Date(activity.created_at)),
      ip: activity.ip_address
    }));

    res.json({
      success: true,
      activities
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent activity'
    });
  }
};

// Helper functions
function getRelativeTime(date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

function formatEventType(eventType) {
  switch (eventType) {
    case 'login': return 'Logged in';
    case 'password_change': return 'Changed password';
    case 'permission_change': return 'Permission updated';
    default: return eventType;
  }
}

// Get meeting statistics
const getMeetingStats = async (req, res) => {
  try {
    // Get total meetings count
    const totalMeetingsResult = await db.query(
      'SELECT COUNT(*) as count FROM meetings'
    );
    const totalMeetings = parseInt(totalMeetingsResult.rows[0].count);

    // Get meetings this month
    const thisMonthResult = await db.query(
      'SELECT COUNT(*) as count FROM meetings WHERE DATE_TRUNC(\'month\', start_time) = DATE_TRUNC(\'month\', CURRENT_DATE)'
    );
    const thisMonth = parseInt(thisMonthResult.rows[0].count);

    // Get completed meetings
    const completedResult = await db.query(
      'SELECT COUNT(*) as count FROM meetings WHERE status = $1',
      ['completed']
    );
    const completed = parseInt(completedResult.rows[0].count);

    // Get average meeting duration
    const avgDurationResult = await db.query(
      'SELECT AVG(duration) as avg_duration FROM meetings WHERE status = $1',
      ['completed']
    );
    const avgDuration = Math.round(avgDurationResult.rows[0].avg_duration || 0);

    res.json({
      success: true,
      data: {
        totalMeetings,
        thisMonth,
        completed,
        avgDuration
      }
    });
  } catch (error) {
    console.error('Get meeting stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get meeting statistics'
    });
  }
};

// Get analytics data
const getAnalytics = async (req, res) => {
  try {
    const { dateRange } = req.query;
    const days = parseInt(dateRange) || 30;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Get total meetings in date range
    const totalMeetingsResult = await db.query(
      'SELECT COUNT(*) as count FROM meetings WHERE start_time >= $1 AND start_time <= $2',
      [startDate, endDate]
    );
    const totalMeetings = parseInt(totalMeetingsResult.rows[0].count);

    // Get total users (active)
    const totalUsersResult = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE status = $1',
      ['active']
    );
    const totalUsers = parseInt(totalUsersResult.rows[0].count);

    // Get total minutes from completed meetings
    const totalMinutesResult = await db.query(
      'SELECT COALESCE(SUM(duration), 0) as total FROM meetings WHERE status = $1 AND start_time >= $2 AND start_time <= $3',
      ['completed', startDate, endDate]
    );
    const totalMinutes = parseInt(totalMinutesResult.rows[0].total);

    // Get average duration
    const avgDurationResult = await db.query(
      'SELECT COALESCE(AVG(duration), 0) as avg FROM meetings WHERE status = $1 AND start_time >= $2 AND start_time <= $3',
      ['completed', startDate, endDate]
    );
    const averageDuration = Math.round(avgDurationResult.rows[0].avg || 0);

    // Get meetings by month (last 12 months)
    const meetingsByMonthResult = await db.query(`
      SELECT 
        TO_CHAR(start_time, 'Mon') as month,
        COUNT(*) as count,
        COALESCE(SUM(duration), 0) as minutes
      FROM meetings 
      WHERE start_time >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', start_time), TO_CHAR(start_time, 'Mon')
      ORDER BY DATE_TRUNC('month', start_time)
    `);

    // Get user engagement (top users by meeting count)
    const userEngagementResult = await db.query(`
      SELECT 
        u.name,
        COUNT(m.id) as meetings,
        COALESCE(SUM(m.duration), 0) as minutes
      FROM users u
      LEFT JOIN meetings m ON u.id = m.host_id 
        AND m.start_time >= $1 AND m.start_time <= $2
      WHERE u.status = 'active'
      GROUP BY u.id, u.name
      HAVING COUNT(m.id) > 0
      ORDER BY COUNT(m.id) DESC
      LIMIT 8
    `, [startDate, endDate]);

    // Get peak hours
    const peakHoursResult = await db.query(`
      SELECT 
        EXTRACT(HOUR FROM start_time) as hour,
        COUNT(*) as count
      FROM meetings 
      WHERE start_time >= $1 AND start_time <= $2
      GROUP BY EXTRACT(HOUR FROM start_time)
      ORDER BY hour
    `, [startDate, endDate]);

    // Get department usage
    const departmentUsageResult = await db.query(`
      SELECT 
        COALESCE(u.department, 'Unknown') as department,
        COUNT(DISTINCT m.id) as meetings,
        COUNT(DISTINCT u.id) as users
      FROM users u
      LEFT JOIN meetings m ON u.id = m.host_id 
        AND m.start_time >= $1 AND m.start_time <= $2
      WHERE u.status = 'active'
      GROUP BY u.department
      HAVING COUNT(DISTINCT m.id) > 0
      ORDER BY COUNT(DISTINCT m.id) DESC
    `, [startDate, endDate]);

    res.json({
      success: true,
      data: {
        totalMeetings,
        totalUsers,
        totalMinutes,
        averageDuration,
        meetingsByMonth: meetingsByMonthResult.rows,
        userEngagement: userEngagementResult.rows,
        peakHours: peakHoursResult.rows,
        departmentUsage: departmentUsageResult.rows
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics data'
    });
  }
};

module.exports = {
  getAdminStats,
  getSystemAlerts,
  getRecentActivity,
  getMeetingStats,
  getAnalytics
};
