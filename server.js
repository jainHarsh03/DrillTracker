/**
 * =====================================================
 * DRILL TRACKER SERVER
 * =====================================================
 * 
 * A professional drill tracking application backend server
 * Built with Express.js, MongoDB, and modern web standards
 * 
 * Features:
 * - RESTful API for drill management
 * - User authentication with JWT
 * - MongoDB integration with Mongoose
 * - CORS support for cross-origin requests
 * - Static file serving for frontend
 * - Production-ready error handling
 * - Health check endpoints
 * - Graceful shutdown handling
 * 
 * @author Drill Tracker Team
 * @version 1.0.0
 * @created 2025-06-25
 * @updated 2025-06-25
 * 
 * GCP Deployment Notes:
 * - Set NODE_ENV=production in Cloud Run environment
 * - Configure MONGODB_URI for Cloud MongoDB Atlas
 * - Set PORT environment variable (Cloud Run provides this)
 * - Configure ALLOWED_ORIGINS for production domains
 * - Enable Cloud Logging for error monitoring
 * =====================================================
 */

// =====================================================
// ENVIRONMENT & DEPENDENCIES
// =====================================================

// Load environment variables first (critical for GCP deployment)
require('dotenv').config();

// Core Express.js dependencies
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Application route modules
const authRoutes = require('./backend/src/routes/auth');
const drillRoutes = require('./backend/src/routes/drills');
const userRoutes = require('./backend/src/routes/users');


// =====================================================
// APPLICATION INITIALIZATION
// =====================================================

// Initialize Express application
const app = express();


// =====================================================
// CONFIGURATION CONSTANTS
// =====================================================

// Server configuration (GCP Cloud Run will set PORT automatically)
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Database configuration (use MongoDB Atlas for GCP deployment)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/drill-tracker';

// CORS configuration for cross-origin requests
// In production (GCP), specify exact allowed origins for security
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || []
    : ['http://localhost:5000', 'http://127.0.0.1:5000'],
  credentials: true,
  optionsSuccessStatus: 200
};


// =====================================================
// MIDDLEWARE CONFIGURATION
// =====================================================

// Enable CORS for cross-origin requests
app.use(cors(corsOptions));

// Parse JSON payloads (limit set for security)
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded payloads
app.use(express.urlencoded({ extended: true }));

// Serve static files with caching for production
app.use(express.static(path.join(__dirname, 'frontend/public'), {
  maxAge: NODE_ENV === 'production' ? '1d' : 0
}));

// Database connection

// =====================================================
// DATABASE CONNECTION & CONFIGURATION
// =====================================================

/**
 * MongoDB Connection Setup
 * 
 * For GCP deployment:
 * - Use MongoDB Atlas cloud database
 * - Set MONGODB_URI in Cloud Run environment variables
 * - Ensure IP whitelist includes 0.0.0.0/0 for Cloud Run
 * - Use connection pooling for better performance
 */
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
  if (NODE_ENV === 'development') {
    console.log(`🔗 Database: ${MONGODB_URI}`);
  }
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error.message);
  // Exit process if database connection fails (critical for GCP)
  process.exit(1);
});

// Database event handlers for monitoring and logging
const db = mongoose.connection;

// Handle database errors (important for GCP Cloud Logging)
db.on('error', (error) => {
  console.error('❌ Database error:', error);
});

// Monitor disconnection events
db.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

// Monitor reconnection events
db.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});


// =====================================================
// API ROUTE CONFIGURATION
// =====================================================

/**
 * RESTful API Routes
 * 
 * All API routes are prefixed with /api for clear separation
 * from static file routes. This helps with GCP load balancing
 * and makes it easier to implement API versioning.
 */

// Authentication routes - handles login, register, token refresh
app.use('/api/auth', authRoutes);

// Drill management routes - CRUD operations for drills
app.use('/api/drills', drillRoutes);

// User management routes - user profile and settings
app.use('/api/users', userRoutes);


// =====================================================
// STATIC PAGE ROUTES
// =====================================================

/**
 * Frontend route handlers
 * 
thoda  * All routes serve the single page application (index.html)
 * which handles routing internally via JavaScript.
 * In GCP, these files will be served from the container's
 * file system. For better performance, consider using
 * Cloud Storage + CDN for static assets in production.
 */

// Root route - serves the single page application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/public', 'index.html'));
});

// Dashboard route - serves the SPA (client-side routing)
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/public', 'index.html'));
});

// Registration route - serves the SPA (client-side routing)
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/public', 'index.html'));
});


// =====================================================
// HEALTH CHECK & MONITORING
// =====================================================

/**
 * Health check endpoint for GCP monitoring
 * 
 * Cloud Run uses this endpoint for:
 * - Container startup probes
 * - Liveness checks
 * - Load balancer health checks
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});


// =====================================================
// ERROR HANDLING & 404 ROUTES
// =====================================================

/**
 * 404 handler for API routes
 * 
 * Returns JSON error response for non-existent API endpoints.
 * This helps frontend applications handle API errors gracefully.
 */
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: `The requested endpoint ${req.originalUrl} does not exist`,
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
});

/**
 * 404 handler for static pages
 * 
 * Serves custom 404 page for invalid routes.
 * This provides better user experience than default browser 404.
 */
app.use('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'frontend/public', '404.html'));
});

/**
 * Global error handler middleware
 * 
 * Catches all unhandled errors and returns appropriate responses.
 * In production (GCP), sensitive error details are hidden for security.
 * All errors are logged for debugging and monitoring.
 */
app.use((error, req, res, next) => {
  // Log error details for debugging (GCP Cloud Logging will capture this)
  console.error('❌ Server Error:', {
    message: error.message,
    stack: error.stack,
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // Don't leak sensitive error details in production
  const message = NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;
    
  res.status(error.status || 500).json({
    error: 'Server Error',
    message: message,
    timestamp: new Date().toISOString(),
    ...(NODE_ENV === 'development' && { stack: error.stack })
  });
});


// =====================================================
// GRACEFUL SHUTDOWN HANDLING
// =====================================================

/**
 * Graceful shutdown handler
 * 
 * Ensures clean shutdown when the application receives SIGINT (Ctrl+C).
 * This is important for GCP Cloud Run to properly handle container shutdowns.
 * 
 * Steps:
 * 1. Stop accepting new connections
 * 2. Close database connections
 * 3. Clean up resources
 * 4. Exit process
 */
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  
  try {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    
    // Exit with success code
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    // Exit with error code
    process.exit(1);
  }
});

/**
 * Handle uncaught exceptions
 * 
 * Log uncaught exceptions and exit gracefully.
 * This prevents the application from running in an unstable state.
 */
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

/**
 * Handle unhandled promise rejections
 * 
 * Log unhandled promise rejections and exit gracefully.
 * This is important for async/await error handling.
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});


// =====================================================
// SERVER STARTUP
// =====================================================

/**
 * Start the Express server
 * 
 * For GCP Cloud Run:
 * - Server will bind to 0.0.0.0:PORT
 * - PORT is automatically provided by Cloud Run
 * - Health checks will be performed on /api/health
 * - Container logs will be sent to Cloud Logging
 */
app.listen(PORT, () => {
  console.log('🚀 =====================================');
  console.log('🚀 DRILL TRACKER SERVER STARTED');
  console.log('🚀 =====================================');
  console.log(`🌐 Server running on port: ${PORT}`);
  console.log(`🔧 Environment: ${NODE_ENV}`);
  console.log(`� Application: http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  
  if (NODE_ENV === 'development') {
    console.log(`🔍 API Health: http://localhost:${PORT}/api/health`);
    console.log(`📋 API Docs: Available at /api/* endpoints`);
  }
  
  console.log('🚀 =====================================');
});

// Export app for testing purposes
module.exports = app;
