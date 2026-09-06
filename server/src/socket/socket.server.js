const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  // JWT Handshake Authentication Middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'collabspace_super_secret_jwt_key_2026'
      );
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.user?.name || 'User'} (${socket.id})`);

    // Join dynamic document room
    socket.on('join-document', async (documentId) => {
      if (!documentId) return;

      socket.join(documentId);
      socket.documentId = documentId;
      console.log(`📄 User ${socket.user?.name || socket.user.id} joined room: ${documentId}`);

      // Broadcast user presence to peers in room
      socket.to(documentId).emit('user-joined', {
        id: socket.user.id,
        name: socket.user.name,
        email: socket.user.email
      });
    });

    // Broadcast delta changes to all other peers in document room
    socket.on('send-changes', ({ documentId, delta }) => {
      if (!documentId || !delta) return;
      socket.to(documentId).emit('receive-changes', delta);
    });

    // Save document contents via WebSocket
    socket.on('save-document', async ({ documentId, content, title }) => {
      if (!documentId) return;
      try {
        await prisma.document.update({
          where: { id: documentId },
          data: {
            content: content !== undefined ? content : undefined,
            title: title !== undefined ? title : undefined,
            updatedAt: new Date()
          }
        });
      } catch (err) {
        // Fallback or memory log
        console.error('Socket save error:', err.message);
      }
    });

    // Leave document room
    socket.on('leave-document', (documentId) => {
      if (!documentId) return;
      socket.leave(documentId);
      socket.to(documentId).emit('user-left', {
        userId: socket.user.id
      });
    });

    // Clean disconnection
    socket.on('disconnect', () => {
      console.log(`❌ Disconnected: ${socket.user?.name || 'User'} (${socket.id})`);
      if (socket.documentId) {
        socket.to(socket.documentId).emit('user-left', {
          userId: socket.user.id
        });
      }
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

module.exports = {
  initSocket,
  getIO
};
