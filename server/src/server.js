const express = require('express');
const http = require('http');
const cors = require('cors');
require('dotenv').config();

const { initSocket } = require('./socket/socket.server');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO on HTTP Server
initSocket(server);

// Enable CORS for client communication
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./routes/auth.routes');
const documentRoutes = require('./routes/document.routes');

// Health Check Endpoint (Sprint 0 Baseline)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'CollabSpace Backend is running smoothly',
    timestamp: new Date().toISOString()
  });
});

// Authentication Routes (Sprint 1)
app.use('/api/auth', authRoutes);

// Document Management Routes (Sprint 2 & 5)
app.use('/api/documents', documentRoutes);

// Root fallback route
app.get('/', (req, res) => {
  res.send('CollabSpace API Server is running. Access /api/health for status.');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    status: 'error',
    message: 'An internal server error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start listening for HTTP & WebSocket connections
server.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`🚀 CollabSpace API & Socket Server started!`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`⚡ WebSocket URL: ws://localhost:${PORT}`);
  console.log(`========================================`);
});

module.exports = { app, server };
