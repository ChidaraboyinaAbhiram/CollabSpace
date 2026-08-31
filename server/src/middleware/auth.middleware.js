const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { memoryUsers } = require('../controllers/auth.controller');

/**
 * Authentication middleware to verify JWT token in Authorization header
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No authentication token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'supersecretjwtkeycollabspace2026';

    // Verify token signature & expiration
    const decoded = jwt.verify(token, secret);

    let user = null;

    try {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true
        }
      });
    } catch (dbErr) {
      // Look up user in memory store if database is offline
      if (memoryUsers) {
        for (const memUser of memoryUsers.values()) {
          if (memUser.id === decoded.userId) {
            user = {
              id: memUser.id,
              name: memUser.name,
              email: memUser.email,
              createdAt: memUser.createdAt
            };
            break;
          }
        }
      }
    }

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. User no longer exists.'
      });
    }

    // Attach user payload to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Auth Middleware Error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication token has expired. Please log in again.'
      });
    }

    return res.status(401).json({
      status: 'error',
      message: 'Invalid authentication token.'
    });
  }
};

module.exports = {
  authenticateToken
};
