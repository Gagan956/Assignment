import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';
import { Notification } from '../models/notification.model';
 
// get Notification
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { unreadOnly = false, limit = 20 } = req.query;

    const query: any = { userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('taskId', 'title');

    const unreadCount = await Notification.countDocuments({ userId, read: false });

    res.json({
      success: true,
      data: { notifications, unreadCount }
    });
  } catch (error: any) {
    logger.error('Get notifications error');
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};


// mark notification as read
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    res.json({ success: true, data: { notification } });
  } catch (error: any) {
    logger.error('Mark notification as read error');
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
};


// mark all notifications as read
export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const result = await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );

    res.json({ 
      success: true, 
      message: 'All notifications marked as read',
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error: any) {
    logger.error('Mark all notifications as read error');
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
  }
};

// delete notification
export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const notification = await Notification.findOneAndDelete({ _id: id, userId });

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error: any) {
    logger.error('Delete notification error');
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
};