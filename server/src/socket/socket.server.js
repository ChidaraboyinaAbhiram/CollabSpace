const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

let io = null;
const documentRooms = new Map(); // documentId -> Map(socketId -> userData)

const USER_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#f97316'  // Orange
];

function getColorForUser(userId = '') {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

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
      socket.user = {
        ...decoded,
        color: getColorForUser(decoded.id)
      };
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.user?.name || 'User'} (${socket.id})`);

    // 1. Join Document Room & Sync Presence Roster
    socket.on('join-document', async (documentId) => {
      if (!documentId) return;

      socket.join(documentId);
      socket.documentId = documentId;

      if (!documentRooms.has(documentId)) {
        documentRooms.set(documentId, new Map());
      }
      const roomMap = documentRooms.get(documentId);
      roomMap.set(socket.id, socket.user);

      console.log(`📄 User ${socket.user?.name} joined room: ${documentId} (Active in room: ${roomMap.size})`);

      const activeUsersList = Array.from(roomMap.values());
      socket.emit('document-presence', activeUsersList);
      socket.to(documentId).emit('user-joined', socket.user);
    });

    // 2. Real-time Delta Text Changes
    socket.on('send-changes', ({ documentId, delta }) => {
      if (!documentId || !delta) return;
      socket.to(documentId).emit('receive-changes', delta);
    });

    // 3. Collaborative Remote Cursors & Selection Range
    socket.on('cursor-move', ({ documentId, range }) => {
      if (!documentId) return;
      socket.to(documentId).emit('remote-cursor-update', {
        userId: socket.user.id,
        range,
        user: socket.user
      });
    });

    // 4. Live Typing Indicators
    socket.on('user-typing', ({ documentId }) => {
      if (!documentId) return;
      socket.to(documentId).emit('user-typing', {
        userId: socket.user.id,
        name: socket.user.name || 'A collaborator'
      });
    });

    socket.on('user-stop-typing', ({ documentId }) => {
      if (!documentId) return;
      socket.to(documentId).emit('user-stop-typing', {
        userId: socket.user.id
      });
    });

    // 5. Real-Time Comment Events (Sprint 8)
    socket.on('new-comment', ({ documentId, comment }) => {
      if (!documentId || !comment) return;
      socket.to(documentId).emit('comment-added', comment);
    });

    socket.on('resolve-comment', ({ documentId, commentId, resolved }) => {
      if (!documentId || !commentId) return;
      socket.to(documentId).emit('comment-resolved', { commentId, resolved });
    });

    socket.on('delete-comment', ({ documentId, commentId }) => {
      if (!documentId || !commentId) return;
      socket.to(documentId).emit('comment-deleted', { commentId });
    });

    // 6. Document Autosave via WebSocket
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
        console.error('Socket save error:', err.message);
      }
    });

    // 7. Leave Document Room & Cleanup
    const handleLeaveRoom = () => {
      const docId = socket.documentId;
      if (!docId) return;

      socket.leave(docId);

      if (documentRooms.has(docId)) {
        const roomMap = documentRooms.get(docId);
        roomMap.delete(socket.id);
        if (roomMap.size === 0) {
          documentRooms.delete(docId);
        }
      }

      socket.to(docId).emit('user-left', { userId: socket.user.id });
      socket.to(docId).emit('remove-cursor', { userId: socket.user.id });
      socket.to(docId).emit('user-stop-typing', { userId: socket.user.id });
    };

    socket.on('leave-document', handleLeaveRoom);

    socket.on('disconnect', () => {
      console.log(`❌ Disconnected: ${socket.user?.name || 'User'} (${socket.id})`);
      handleLeaveRoom();
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
