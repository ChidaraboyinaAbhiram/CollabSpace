const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

// In-memory fallback user store (used when local PostgreSQL is not running yet in Sprint 1-3)
const memoryUsers = new Map();

// Helper to generate JWT token
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'supersecretjwtkeycollabspace2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ userId }, secret, { expiresIn });
};

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    let existingUser = null;
    let isDbAvailable = true;

    try {
      existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });
    } catch (dbErr) {
      console.warn('PostgreSQL database not reached. Using in-memory auth store for Sprint 1.');
      isDbAvailable = false;
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
      newUser = await prisma.user.create({
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
      });
    } else {
      const crypto = require('crypto');
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
    const token = generateToken(newUser.id);

    // Sanitize password from response payload
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
    const normalizedEmail = email.toLowerCase().trim();

    let user = null;
    let isDbAvailable = true;

    try {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });
    } catch (dbErr) {
      isDbAvailable = false;
      user = memoryUsers.get(normalizedEmail) || null;
    }

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.'
      });
    }

    // Compare plain password with stored bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.'
      });
    }

    // Generate token
    const token = generateToken(user.id);

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    };

    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      user: userPayload
    });
  } catch (error) {
    console.error('Login Controller Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to authenticate user due to a server error'
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
    console.error('GetMe Controller Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user profile'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  memoryUsers
};
