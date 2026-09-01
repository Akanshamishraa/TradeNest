import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'tradenest_super_secret_jwt_key_2026';

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d'
  });
};

// In-memory demo store fallback if MongoDB offline
const inMemoryUsers = new Map();

/*
  REGISTER USER
  POST /api/auth/register
*/
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. If MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      const userExists = await User.findOne({ email: cleanEmail });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists'
        });
      }

      const user = await User.create({
        name: name.trim(),
        email: cleanEmail,
        password
      });

      const token = generateToken(user._id);

      return res.status(201).json({
        success: true,
        message: 'Registration successful! Welcome to TradeNest.',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          watchlist: user.watchlist,
          token
        }
      });
    }

    // 2. In-Memory fallback if MongoDB service is not started
    if (inMemoryUsers.has(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    const mockId = 'usr_' + Date.now();
    const mockUser = {
      _id: mockId,
      name: name.trim(),
      email: cleanEmail,
      password,
      watchlist: ['BSE:SENSEX', 'NSE:NIFTY50', 'RELIANCE', 'TCS', 'AAPL', 'NVDA', 'CRYPTO:BTC']
    };
    inMemoryUsers.set(cleanEmail, mockUser);
    const token = generateToken(mockId);

    return res.status(201).json({
      success: true,
      message: 'Registration successful (Demo Mode)! Welcome to TradeNest.',
      data: {
        _id: mockUser._id,
        name: mockUser.name,
        email: mockUser.email,
        watchlist: mockUser.watchlist,
        token
      }
    });

  } catch (error) {
    console.error('Error in registerUser:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

/*
  LOGIN USER
  POST /api/auth/login
*/
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. If MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const token = generateToken(user._id);

      return res.json({
        success: true,
        message: 'Welcome back, ' + user.name + '!',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          watchlist: user.watchlist,
          token
        }
      });
    }

    // 2. In-memory fallback
    const mockUser = inMemoryUsers.get(cleanEmail);
    if (!mockUser || mockUser.password !== password) {
      // Allow demo pre-configured login
      if (cleanEmail === 'trader@tradenest.com' && password === 'trader123') {
        const demoId = 'demo_user_1';
        return res.json({
          success: true,
          message: 'Welcome to TradeNest Demo!',
          data: {
            _id: demoId,
            name: 'Akansha Mishra',
            email: 'trader@tradenest.com',
            watchlist: ['BSE:SENSEX', 'NSE:NIFTY50', 'RELIANCE', 'TCS', 'AAPL', 'NVDA'],
            token: generateToken(demoId)
          }
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    return res.json({
      success: true,
      message: 'Welcome back, ' + mockUser.name + '!',
      data: {
        _id: mockUser._id,
        name: mockUser.name,
        email: mockUser.email,
        watchlist: mockUser.watchlist,
        token: generateToken(mockUser._id)
      }
    });

  } catch (error) {
    console.error('Error in loginUser:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
};

/*
  GET CURRENT USER PROFILE
  GET /api/auth/me
*/
export const getMe = async (req, res) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      return res.json({ success: true, data: user });
    }

    // In-memory fallback
    return res.json({
      success: true,
      data: {
        _id: decoded.id,
        name: 'Pro Trader',
        email: 'trader@tradenest.com',
        watchlist: ['BSE:SENSEX', 'NSE:NIFTY50', 'RELIANCE', 'TCS', 'AAPL', 'NVDA']
      }
    });

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized / token expired'
    });
  }
};

/*
  UPDATE USER WATCHLIST
  PUT /api/auth/watchlist
*/
export const updateWatchlist = async (req, res) => {
  try {
    const { watchlist } = req.body;
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token || !Array.isArray(watchlist)) {
      return res.status(400).json({ success: false, message: 'Invalid watchlist payload' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (mongoose.connection.readyState === 1) {
      const user = await User.findByIdAndUpdate(
        decoded.id,
        { watchlist },
        { new: true }
      ).select('-password');

      return res.json({ success: true, data: user });
    }

    return res.json({ success: true, data: { watchlist } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
