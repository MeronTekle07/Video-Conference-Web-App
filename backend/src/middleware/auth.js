const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist and are active
    const result = await db.query(
      'SELECT id, name, email, role, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const user = result.rows[0];

    if (user.status !== 'active') {
      return res.status(401).json({ 
        success: false, 
        message: 'User account is not active' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
};

// Middleware to check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const userRole = req.user.role;
    
    // Convert single role to array for easier handling
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

// Specific role middleware functions
const requireAdmin = requireRole(['admin']);
const requireSupervisor = requireRole(['admin', 'supervisor']);
const requireAuditor = requireRole(['admin', 'auditor']);
const requireUser = requireRole(['user', 'admin', 'supervisor', 'auditor']);

// Middleware to log security events
const logSecurityEvent = async (userId, eventType, details, severity = 'low', ipAddress = null) => {
  try {
    // Only log valid event types according to the database constraint
    const validEventTypes = ['login', 'failed_login', 'password_change', 'permission_change', 'data_access', 'suspicious_activity'];
    
    if (!validEventTypes.includes(eventType)) {
      console.warn(`Invalid security event type: ${eventType}. Skipping log.`);
      return;
    }
    
    await db.query(
      `INSERT INTO security_events (user_id, event_type, details, severity, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, eventType, details, severity, ipAddress]
    );
  } catch (error) {
    console.error('Error logging security event:', error);
  }
};

// Rate limiting middleware for login attempts
const loginRateLimit = (req, res, next) => {
  // This is a simple in-memory rate limiter
  // In production, use Redis or a proper rate limiting library
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  if (!req.app.locals.loginAttempts) {
    req.app.locals.loginAttempts = new Map();
  }

  const attempts = req.app.locals.loginAttempts.get(clientIP) || { count: 0, resetTime: now + windowMs };

  if (now > attempts.resetTime) {
    attempts.count = 0;
    attempts.resetTime = now + windowMs;
  }

  if (attempts.count >= maxAttempts) {
    return res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again later.'
    });
  }

  attempts.count++;
  req.app.locals.loginAttempts.set(clientIP, attempts);

  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireSupervisor,
  requireAuditor,
  requireUser,
  logSecurityEvent,
  loginRateLimit
}; 