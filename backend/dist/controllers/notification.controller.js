"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const notification_model_1 = require("../models/notification.model");
// get Notification
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { unreadOnly = false, limit = 20 } = req.query;
        const query = { userId };
        if (unreadOnly === 'true') {
            query.read = false;
        }
        const notifications = await notification_model_1.Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .populate('taskId', 'title');
        const unreadCount = await notification_model_1.Notification.countDocuments({ userId, read: false });
        res.json({
            success: true,
            data: { notifications, unreadCount }
        });
    }
    catch (error) {
        logger_1.default.error('Get notifications error');
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
};
exports.getNotifications = getNotifications;
// mark notification as read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const notification = await notification_model_1.Notification.findOneAndUpdate({ _id: id, userId }, { read: true }, { new: true });
        if (!notification) {
            res.status(404).json({ success: false, message: 'Notification not found' });
            return;
        }
        res.json({ success: true, data: { notification } });
    }
    catch (error) {
        logger_1.default.error('Mark notification as read error');
        res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
    }
};
exports.markAsRead = markAsRead;
// mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await notification_model_1.Notification.updateMany({ userId, read: false }, { read: true });
        res.json({
            success: true,
            message: 'All notifications marked as read',
            data: { modifiedCount: result.modifiedCount }
        });
    }
    catch (error) {
        logger_1.default.error('Mark all notifications as read error');
        res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
    }
};
exports.markAllAsRead = markAllAsRead;
// delete notification
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const notification = await notification_model_1.Notification.findOneAndDelete({ _id: id, userId });
        if (!notification) {
            res.status(404).json({ success: false, message: 'Notification not found' });
            return;
        }
        res.json({ success: true, message: 'Notification deleted successfully' });
    }
    catch (error) {
        logger_1.default.error('Delete notification error');
        res.status(500).json({ success: false, message: 'Failed to delete notification' });
    }
};
exports.deleteNotification = deleteNotification;
