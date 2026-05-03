require('dotenv').config();
require('express-async-errors');
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const analysisRoutes = require('./routes/analysis');
const analyticsRoutes = require('./routes/analytics');
const academyRoutes = require('./routes/academy');
const socketSetup = require('./socket');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible in routes via req.app.get('io')
app.set('io', io);

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    env: {
      has_mongo: !!process.env.MONGODB_URI,
      has_jwt: !!process.env.JWT_SECRET,
      node_env: process.env.NODE_ENV
    }
  });
});

// Serve static files from the frontend/dist folder
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/academy', academyRoutes);

// Handle SPA routing - serve index.html for any unknown routes
app.get('*', (req, res, next) => {
  // If the request is for an API route that wasn't matched, skip to 404
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// Socket.IO
socketSetup(io);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const statusCode = err.statusCode || err.status || 500;
  
  // Specific handling for MongoDB errors
  let message = err.message || 'Internal server error';
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(val => val.message).join(', ');
  } else if (err.code === 11000) {
    message = 'Duplicate field value entered';
  }

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler for API routes
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found.` });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

// Only listen if not running as a Vercel function
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('✅ Connected to MongoDB Atlas');
      server.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('❌ MongoDB connection failed:', err.message);
    });
} else {
  // On Vercel, just connect to MongoDB
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas (Vercel)'))
    .catch(err => console.error('❌ MongoDB connection failed (Vercel):', err.message));
}

module.exports = app;
