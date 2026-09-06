const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/db');

// In-memory fallback user store (used when local PostgreSQL is not running yet)
const memoryUsers = new Map();
let isDbAvailable = true;

const withDbTimeout = (promise, ms = 400) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), ms))
  ]);
};

// Helper to generate JWT token with full user payload
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'collabspace_super_secret_jwt_key_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    {
      id: user.id,
      userId: user.id,
      name: user.name,
      email: user.email
    },
    secret,
    { expiresIn }
  );
};

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, email, and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters long.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let existingUser = null;

    if (isDbAvailable) {
      try {
        existingUser = await withDbTimeout(
          prisma.user.findUnique({
            where: { email: normalizedEmail }
          }),
          400
        );
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable) {
      existingUser = memoryUsers.get(normalizedEmail) || null;
    }

    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'An account with this email address already exists.'
      });
    }

    // Hash password with salt round = 10
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let newUser = null;

    if (isDbAvailable) {
      try {
        newUser = await withDbTimeout(
          prisma.user.create({
            data: {
              name: name.trim(),
              email: normalizedEmail,
              password: hashedPassword
            },
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true
            }
          }),
          400
        );
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable || !newUser) {
      newUser = {
        id: crypto.randomUUID(),
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      };
      memoryUsers.set(normalizedEmail, newUser);
    }

    // Generate JWT token
    const token = generateToken(newUser);

    const userPayload = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt
    };

    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      token,
      user: userPayload
    });
  } catch (error) {
    console.error('Register Controller Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to register user due to a server error'
    });
  }
};

/**
 * Log in an existing user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = null;

    if (isDbAvailable) {
      try {
        user = await withDbTimeout(
          prisma.user.findUnique({
            where: { email: normalizedEmail }
          }),
          400
        );
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable) {
      user = memoryUsers.get(normalizedEmail) || null;
    }

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken(user);

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    };

    return res.status(200).json({
      status: 'success',
      message: 'Logged in successfully',
      token,
      user: userPayload
    });
  } catch (error) {
    console.error('Login Controller Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to log in due to a server error'
    });
  }
};

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      status: 'success',
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve profile'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  memoryUsers
};
