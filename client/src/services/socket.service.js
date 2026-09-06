import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';

let socket = null;

/**
 * Get or initialize active Socket.IO connection
 */
export const getSocket = () => {
  const token = localStorage.getItem('collabspace_token');

  if (!socket && token) {
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('⚡ Socket connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ Socket connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });
  }

  return socket;
};

/**
 * Disconnect socket on logout
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
