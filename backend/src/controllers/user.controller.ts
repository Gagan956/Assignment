import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';


// update profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    const userId = req.user!.userId;

    const user = await User.findByIdAndUpdate(
      userId,
      { name },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    logger.info(`Profile updated for user: ${userId}`);
    res.json({ success: true, data: { user } });
  } catch (error: any) {
    logger.error('Update profile error');
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};


// get all users
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-password').sort({ name: 1 });
    
    res.json({ success: true, data: { users } });
  } catch (error: any) {
    logger.error('Get all users error');
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};