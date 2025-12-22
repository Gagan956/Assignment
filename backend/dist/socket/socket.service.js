"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketService = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
const logger_1 = __importDefault(require("../utils/logger"));
class SocketService {
    constructor() {
        this.io = null;
        this.users = new Map();
        this.debounceTimers = new Map();
        this.connectionCount = 0;
    }
    initialize(server) {
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: 'https://assignment-silk-eight.vercel.app',
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            },
            transports: ['websocket', 'polling'],
            pingTimeout: 60000,
            pingInterval: 25000,
            connectTimeout: 45000,
            maxHttpBufferSize: 1e6,
            allowEIO3: true,
        });
        // Middleware for authentication
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
                if (!token) {
                    logger_1.default.warn('Socket connection attempt without token');
                    return next(new Error('Authentication error: No token provided'));
                }
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                const user = await user_model_1.User.findById(decoded.userId).select('_id role name email');
                if (!user) {
                    logger_1.default.warn(`Socket auth failed: User ${decoded.userId} not found`);
                    return next(new Error('Authentication error: User not found'));
                }
                socket.user = {
                    userId: user._id.toString(),
                    role: user.role,
                    name: user.name,
                    email: user.email
                };
                logger_1.default.info(`Socket authenticated for user: ${user.name} (${user._id})`);
                next();
            }
            catch (error) {
                logger_1.default.error('Socket auth error:', error.message);
                next(new Error('Authentication error: Invalid token'));
            }
        });
        this.io.on('connection', (socket) => {
            const user = socket.user;
            if (!user) {
                socket.disconnect();
                return;
            }
            this.connectionCount++;
            logger_1.default.info(`New socket connection (${this.connectionCount} total): User ${user.name}`);
            // Store user connection
            this.users.set(user.userId, {
                userId: user.userId,
                socketId: socket.id,
                role: user.role,
                name: user.name
            });
            // Join user to their room
            socket.join(`user_${user.userId}`);
            // Join admin room if admin
            if (user.role === 'admin') {
                socket.join('admin_room');
                logger_1.default.info(`Admin ${user.name} joined admin_room`);
            }
            // Emit connection status to user
            socket.emit('connected', {
                userId: user.userId,
                timestamp: new Date().toISOString()
            });
            socket.on('disconnect', (reason) => {
                this.users.delete(user.userId);
                this.connectionCount--;
                logger_1.default.info(`Socket disconnected: ${user.name}. Reason: ${reason}. Active connections: ${this.connectionCount}`);
            });
            socket.on('error', (error) => {
                logger_1.default.error(`Socket error for user ${user.name}:`, error);
            });
            // Heartbeat/ping
            socket.on('ping', (data) => {
                socket.emit('pong', { ...data, timestamp: new Date().toISOString() });
            });
        });
        // Monitor socket connections
        setInterval(() => {
            logger_1.default.debug(`Active socket connections: ${this.connectionCount}`);
        }, 60000);
        logger_1.default.info('Socket.IO server initialized successfully');
    }
    getIO() {
        if (!this.io) {
            throw new Error('Socket.IO not initialized');
        }
        return this.io;
    }
    // Emit task assigned event with debouncing
    emitTaskAssigned(task, assignerName) {
        if (!this.io)
            return;
        const key = `task_assigned_${task._id}_${task.assignedToId?._id}`;
        this.clearDebounce(key);
        this.debounceTimers.set(key, setTimeout(() => {
            try {
                const notificationData = {
                    _id: Date.now().toString(),
                    userId: task.assignedToId?._id,
                    message: `${assignerName} assigned you a new task: "${task.title}"`,
                    type: 'task_assigned',
                    taskId: task._id,
                    read: false,
                    createdAt: new Date().toISOString()
                };
                // Emit to specific user
                if (task.assignedToId?._id) {
                    this.emitToUser(task.assignedToId._id, 'notification', notificationData);
                }
                // Emit general task update
                this.emitTaskUpdated(task);
                logger_1.default.info(`Task assigned: ${task.title} to ${task.assignedToId?.name}`);
            }
            catch (error) {
                logger_1.default.error('Error emitting task assigned:', error);
            }
            finally {
                this.debounceTimers.delete(key);
            }
        }, 50));
    }
    // Emit task status changed event
    emitTaskStatusChanged(task, oldStatus, newStatus, changedByName) {
        if (!this.io)
            return;
        const key = `task_status_${task._id}`;
        this.clearDebounce(key);
        this.debounceTimers.set(key, setTimeout(() => {
            try {
                let message = '';
                switch (newStatus) {
                    case 'In Progress':
                        message = `${changedByName} started working on task: "${task.title}"`;
                        break;
                    case 'Review':
                        message = `${changedByName} sent task "${task.title}" for review`;
                        break;
                    case 'Completed':
                        message = `${changedByName} completed task: "${task.title}"`;
                        break;
                    default:
                        message = `${changedByName} changed task "${task.title}" status from ${oldStatus} to ${newStatus}`;
                }
                if (task.creatorId?._id && task.creatorId._id.toString() !== changedByName) {
                    const notificationData = {
                        _id: Date.now().toString(),
                        userId: task.creatorId._id,
                        message: message,
                        type: 'task_status_changed',
                        taskId: task._id,
                        read: false,
                        createdAt: new Date().toISOString()
                    };
                    this.emitToUser(task.creatorId._id, 'notification', notificationData);
                }
                // If task completed, notify admin room
                if (newStatus === 'Completed') {
                    const adminNotification = {
                        _id: Date.now().toString(),
                        message: `Task "${task.title}" has been completed by ${changedByName}`,
                        type: 'task_completed',
                        taskId: task._id,
                        read: false,
                        createdAt: new Date().toISOString()
                    };
                    this.io.to('admin_room').emit('notification', adminNotification);
                }
                this.emitTaskUpdated(task);
                logger_1.default.info(`Task status changed: ${task.title} from ${oldStatus} to ${newStatus}`);
            }
            catch (error) {
                logger_1.default.error('Error emitting task status changed:', error);
            }
            finally {
                this.debounceTimers.delete(key);
            }
        }, 50));
    }
    emitTaskCreated(task) {
        if (!this.io)
            return;
        const key = `task_created_${task._id}`;
        this.clearDebounce(key);
        this.debounceTimers.set(key, setTimeout(() => {
            try {
                this.io.emit('task_created', task);
                logger_1.default.info(`Task created: ${task.title}`);
            }
            catch (error) {
                logger_1.default.error('Error emitting task created:', error);
            }
            finally {
                this.debounceTimers.delete(key);
            }
        }, 50));
    }
    emitTaskUpdated(task) {
        if (!this.io)
            return;
        const key = `task_updated_${task._id}`;
        this.clearDebounce(key);
        this.debounceTimers.set(key, setTimeout(() => {
            try {
                this.io.emit('task_updated', task);
            }
            catch (error) {
                logger_1.default.error('Error emitting task updated:', error);
            }
            finally {
                this.debounceTimers.delete(key);
            }
        }, 50));
    }
    emitTaskDeleted(taskId) {
        if (!this.io)
            return;
        const key = `task_deleted_${taskId}`;
        this.clearDebounce(key);
        this.debounceTimers.set(key, setTimeout(() => {
            try {
                this.io.emit('task_deleted', taskId);
                logger_1.default.info(`Task deleted: ${taskId}`);
            }
            catch (error) {
                logger_1.default.error('Error emitting task deleted:', error);
            }
            finally {
                this.debounceTimers.delete(key);
            }
        }, 50));
    }
    emitNotification(userId, notification) {
        if (!this.io)
            return;
        const key = `notification_${userId}_${notification._id}`;
        this.clearDebounce(key);
        this.debounceTimers.set(key, setTimeout(() => {
            try {
                this.emitToUser(userId, 'notification', notification);
            }
            catch (error) {
                logger_1.default.error('Error emitting notification:', error);
            }
            finally {
                this.debounceTimers.delete(key);
            }
        }, 50));
    }
    // Private helper methods
    emitToUser(userId, event, data) {
        if (this.io) {
            this.io.to(`user_${userId}`).emit(event, data);
        }
    }
    broadcast(event, data) {
        if (!this.io)
            return;
        const key = `broadcast_${event}`;
        this.clearDebounce(key);
        this.debounceTimers.set(key, setTimeout(() => {
            try {
                this.io.emit(event, data);
            }
            catch (error) {
                logger_1.default.error('Error broadcasting:', error);
            }
            finally {
                this.debounceTimers.delete(key);
            }
        }, 50));
    }
    clearDebounce(key) {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
            this.debounceTimers.delete(key);
        }
    }
    // Cleanup all timers
    cleanup() {
        this.debounceTimers.forEach((timer) => clearTimeout(timer));
        this.debounceTimers.clear();
        this.users.clear();
        this.connectionCount = 0;
    }
    // Get active user connections
    getActiveUsers() {
        return Array.from(this.users.values());
    }
}
exports.socketService = new SocketService();
