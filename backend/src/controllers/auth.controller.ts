import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';


// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'User already exists' });
      return;
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user'
    });

    // Generate token
    const token = generateToken(user);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    logger.info(`User registered: ${user.email}`);
    res.status(201).json({
      success: true,
      data: { user: userResponse, token }
    });
  } catch (error: any) {
    logger.error('Registration error');
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};


// Login a user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    // Generate token
    const token = generateToken(user);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    logger.info(`User logged in: ${user.email}`);
    res.json({
      success: true,
      data: { user: userResponse, token }
    });
  } catch (error: any) {
    logger.error('Login error');
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};


// Logout a user
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie('token');
    logger.info('User logged out');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    logger.error('Logout error');
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

// Get current user
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId).select('-password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({ success: true, data: { user } });
  } catch (error: any) {
    logger.error('Get current user error');
    res.status(500).json({ success: false, message: 'Failed to get user' });
  }
};