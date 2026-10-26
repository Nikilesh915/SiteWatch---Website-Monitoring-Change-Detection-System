import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Monitor from '../models/Monitor.js';
import { checkSingleMonitor } from '../services/schedulerService.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'sitewatch_super_secret_jwt_key_2026_modern', {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, alertEmail } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      alertEmail: alertEmail || email,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        alertEmail: user.alertEmail,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        alertEmail: user.alertEmail,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/demo
// @desc    Instant demo login with pre-seeded sample monitors
router.post('/demo', async (req, res) => {
  try {
    let demoUser = await User.findOne({ email: 'demo@sitewatch.io' });

    if (!demoUser) {
      demoUser = await User.create({
        name: 'Demo Explorer',
        email: 'demo@sitewatch.io',
        password: 'demopassword123',
        alertEmail: 'demo@sitewatch.io',
      });

      // Seed default sample monitors for the demo user
      const port = process.env.PORT || 5000;
      const seedMonitors = [
        {
          userId: demoUser._id,
          name: 'Sandbox E-Commerce Product',
          url: `http://localhost:${port}/api/sandbox/page`,
          selector: '#price-card',
          interval: '1m',
          tags: ['Sandbox', 'E-Commerce'],
          notifyEmail: 'demo@sitewatch.io',
        },
        {
          userId: demoUser._id,
          name: 'Hacker News Frontpage',
          url: 'https://news.ycombinator.com',
          selector: '.titleline',
          interval: '15m',
          tags: ['Tech News', 'Community'],
          notifyEmail: 'demo@sitewatch.io',
        },
        {
          userId: demoUser._id,
          name: 'GitHub Status',
          url: 'https://www.githubstatus.com',
          selector: '.page-status',
          interval: '5m',
          tags: ['Infrastructure', 'Status'],
          notifyEmail: 'demo@sitewatch.io',
        }
      ];

      for (const monData of seedMonitors) {
        const mon = await Monitor.create(monData);
        // Trigger initial baseline check asynchronously
        checkSingleMonitor(mon._id).catch(e => console.warn('Demo seed check notice:', e.message));
      }
    }

    const token = generateToken(demoUser._id);

    res.json({
      success: true,
      token,
      user: {
        id: demoUser._id,
        name: demoUser.name,
        email: demoUser.email,
        alertEmail: demoUser.alertEmail,
        preferences: demoUser.preferences,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user details
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// @route   PUT /api/auth/preferences
// @desc    Update alert preferences
router.put('/preferences', protect, async (req, res) => {
  try {
    const { alertEmail, emailNotifications, defaultCheckInterval } = req.body;
    const user = await User.findById(req.user._id);

    if (alertEmail !== undefined) user.alertEmail = alertEmail;
    if (emailNotifications !== undefined) user.preferences.emailNotifications = emailNotifications;
    if (defaultCheckInterval !== undefined) user.preferences.defaultCheckInterval = defaultCheckInterval;

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        alertEmail: user.alertEmail,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
