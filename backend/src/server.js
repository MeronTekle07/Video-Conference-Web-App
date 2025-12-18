const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const meetingRoutes = require('./routes/meetings');
const settingsRoutes = require('./routes/settings');
const contactsRoutes = require('./routes/contacts');
const adminRoutes = require('./routes/admin');

// Import database connection
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'VideoConf Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/settings', settingsRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.errors
    });
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Handle database errors
  if (error.code === '23505') { // Unique constraint violation
    return res.status(409).json({
      success: false,
      message: 'Resource already exists'
    });
  }

  if (error.code === '23503') { // Foreign key constraint violation
    return res.status(400).json({
      success: false,
      message: 'Invalid reference'
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  });
});

// Create HTTP server and Socket.IO
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Initialize signaling
require('./realtime/signaling')(io);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    db.pool.end(() => {
      console.log('Database connections closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    db.pool.end(() => {
      console.log('Database connections closed');
      process.exit(0);
    });
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 VideoConf Backend server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
  console.log(`📅 Meetings API: http://localhost:${PORT}/api/meetings`);
  console.log(`📅 Calendar API: http://localhost:${PORT}/api/calendar`);
  console.log(`🔔 Signaling: ws://localhost:${PORT}`);
});

module.exports = { app, server, io };