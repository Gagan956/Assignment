"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentTasks = exports.getDashboardStats = exports.deleteTask = exports.updateTask = exports.getTaskById = exports.getTasks = exports.updateTaskStatus = exports.createTask = void 0;
const task_model_1 = require("../models/task.model");
const user_model_1 = require("../models/user.model");
const logger_1 = __importDefault(require("../utils/logger"));
const notification_model_1 = require("../models/notification.model");
const socket_service_1 = require("../socket/socket.service");
// Get all tasks
const createTask = async (req, res) => {
    try {
        const { title, description, dueDate, priority, assignedToId } = req.body;
        const creatorId = req.user.userId;
        const userRole = req.user.role;
        const creatorName = req.user.name;
        // Validate required fields
        if (!title || !description || !dueDate || !assignedToId) {
            res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
            return;
        }
        // Prevent admin from assigning task to themselves
        if (userRole === "admin" && creatorId === assignedToId) {
            res.status(400).json({
                success: false,
                message: "Admin cannot assign tasks to themselves",
            });
            return;
        }
        // Check if assigned user exists
        const assignedUser = await user_model_1.User.findById(assignedToId);
        if (!assignedUser) {
            res
                .status(404)
                .json({ success: false, message: "Assigned user not found" });
            return;
        }
        // Check for duplicate task
        const existingTask = await task_model_1.Task.findOne({
            title: { $regex: new RegExp(`^${title.trim()}$`, "i") },
            assignedToId,
            creatorId,
            status: { $nin: ["Completed", "Cancelled"] },
        });
        if (existingTask) {
            res.status(409).json({
                success: false,
                message: "A similar active task already exists for this user",
                existingTask: {
                    id: existingTask._id,
                    title: existingTask.title,
                    status: existingTask.status,
                },
            });
            return;
        }
        // Create task
        const task = await task_model_1.Task.create({
            title: title.trim(),
            description: description.trim(),
            dueDate: new Date(dueDate),
            priority: priority || "Medium",
            status: "To Do",
            creatorId,
            assignedToId,
        });
        // Populate task
        const populatedTask = await task_model_1.Task.findById(task._id)
            .populate("creatorId", "name email role")
            .populate("assignedToId", "name email");
        // Create notification
        await notification_model_1.Notification.create({
            userId: assignedToId,
            message: `${creatorName} assigned you a new task: "${title}"`,
            type: "task_assigned",
            taskId: task._id,
            read: false,
        });
        // Emit socket events
        socket_service_1.socketService.emitTaskAssigned(populatedTask, creatorName);
        socket_service_1.socketService.emitTaskCreated(populatedTask);
        res.status(201).json({
            success: true,
            data: {
                task: populatedTask,
                message: `Task assigned to ${assignedUser.name}`,
            },
        });
    }
    catch (error) {
        if (error.code === 11000) {
            res.status(409).json({
                success: false,
                message: "Duplicate task detected",
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: "Failed to create task",
            });
        }
    }
};
exports.createTask = createTask;
// Update task status
const updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const { status } = req.body;
        // Validate status
        const validStatuses = ["To Do", "In Progress", "Review", "Completed"];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ success: false, message: "Invalid status value" });
            return;
        }
        // Find task
        const task = await task_model_1.Task.findById(id)
            .populate("creatorId", "name email")
            .populate("assignedToId", "name email");
        if (!task) {
            res.status(404).json({ success: false, message: "Task not found" });
            return;
        }
        // Authorization check
        const canUpdateStatus = task.assignedToId._id.toString() === userId;
        if (!canUpdateStatus) {
            res.status(403).json({
                success: false,
                message: "Only assigned user can update task status",
            });
            return;
        }
        // Get user making the change
        const user = await user_model_1.User.findById(userId);
        const userName = user?.name || "Unknown";
        const oldStatus = task.status;
        // Update status
        task.status = status;
        task.updatedAt = new Date();
        await task.save();
        // Get updated task
        const updatedTask = await task_model_1.Task.findById(id)
            .populate("creatorId", "name email")
            .populate("assignedToId", "name email");
        // Create notifications based on status change
        if (oldStatus !== status) {
            let message = "";
            switch (status) {
                case "In Progress":
                    message = `${userName} started working on task: "${task.title}"`;
                    break;
                case "Review":
                    message = `${userName} sent task "${task.title}" for review`;
                    break;
                case "Completed":
                    message = `${userName} completed task: "${task.title}"`;
                    break;
                default:
                    message = `${userName} changed task "${task.title}" status from ${oldStatus} to ${status}`;
            }
            // Notify creator if not the one changing
            if (task.creatorId._id.toString() !== userId) {
                await notification_model_1.Notification.create({
                    userId: task.creatorId._id,
                    message,
                    type: "task_status_changed",
                    taskId: task._id,
                    read: false,
                });
            }
            // Notify all admins for completed tasks
            if (status === "Completed") {
                const admins = await user_model_1.User.find({ role: "admin" });
                for (const admin of admins) {
                    if (admin._id.toString() !== userId) {
                        await notification_model_1.Notification.create({
                            userId: admin._id,
                            message: `Task "${task.title}" has been completed by ${userName}`,
                            type: "task_completed",
                            taskId: task._id,
                            read: false,
                        });
                    }
                }
            }
        }
        socket_service_1.socketService.emitTaskUpdated(updatedTask);
        if (oldStatus !== status) {
            socket_service_1.socketService.emitTaskStatusChanged(updatedTask, oldStatus, status, userName);
        }
        logger_1.default.info(`Task status updated: ${task.title} from ${oldStatus} to ${status} by ${userName}`);
        res.json({
            success: true,
            data: {
                task: updatedTask,
                message: `Task status updated from ${oldStatus} to ${status}`,
            },
        });
    }
    catch (error) {
        logger_1.default.error("Update task status error");
        res.status(500).json({
            success: false,
            message: "Failed to update task status",
        });
    }
};
exports.updateTaskStatus = updateTaskStatus;
//get tasks
const getTasks = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { status, priority, sort = "dueDate", page = 1, limit = 10, assigned = false, created = false, } = req.query;
        const query = {};
        if (userRole === "admin") {
        }
        else {
            query.$or = [{ assignedToId: userId }, { creatorId: userId }];
        }
        // Filter for specific views
        if (assigned === "true") {
            if (userRole === "admin") {
                query.assignedToId = { $exists: true };
            }
            else {
                query.assignedToId = userId;
            }
        }
        if (created === "true") {
            if (userRole === "admin") {
                query.creatorId = { $exists: true };
            }
            else {
                query.creatorId = userId;
            }
        }
        // Apply filters
        if (status)
            query.status = status;
        if (priority)
            query.priority = priority;
        // Parse sort parameter
        let sortOption = { dueDate: 1 };
        if (sort && typeof sort === "string") {
            const [field, order] = sort.split(":");
            sortOption = { [field]: order === "desc" ? -1 : 1 };
        }
        // Execute query with pagination
        const skip = (Number(page) - 1) * Number(limit);
        const tasks = await task_model_1.Task.find(query)
            .populate("creatorId", "name email")
            .populate("assignedToId", "name email")
            .sort(sortOption)
            .skip(skip)
            .limit(Number(limit))
            .lean();
        const total = await task_model_1.Task.countDocuments(query);
        // Add isOverdue flag
        const tasksWithOverdue = tasks.map((task) => ({
            ...task,
            isOverdue: new Date(task.dueDate) < new Date() && task.status !== "Completed",
        }));
        logger_1.default.info(`Tasks fetched for user: ${userId}, role: ${userRole}`);
        res.json({
            success: true,
            data: {
                tasks: tasksWithOverdue,
                total,
                page: Number(page),
                limit: Number(limit),
                hasMore: skip + tasks.length < total,
            },
        });
    }
    catch (error) {
        logger_1.default.error("Get tasks error");
        res.status(500).json({ success: false, message: "Failed to fetch tasks" });
    }
};
exports.getTasks = getTasks;
// Get task by ID
const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const task = await task_model_1.Task.findById(id)
            .populate("creatorId", "name email")
            .populate("assignedToId", "name email");
        if (!task) {
            res.status(404).json({ success: false, message: "Task not found" });
            return;
        }
        const canAccess = userRole === "admin" ||
            task.creatorId._id.toString() === userId ||
            task.assignedToId._id.toString() === userId;
        if (!canAccess) {
            res
                .status(403)
                .json({
                success: false,
                message: "Not authorized to access this task",
            });
            return;
        }
        res.json({ success: true, data: { task } });
    }
    catch (error) {
        logger_1.default.error("Get task by ID error");
        res.status(500).json({ success: false, message: "Failed to fetch task" });
    }
};
exports.getTaskById = getTaskById;
// Update task
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const updateData = req.body;
        const task = await task_model_1.Task.findById(id)
            .populate("creatorId", "name email")
            .populate("assignedToId", "name email");
        if (!task) {
            res.status(404).json({ success: false, message: "Task not found" });
            return;
        }
        const canUpdate = userRole === "admin" || task.creatorId._id.toString() === userId;
        if (!canUpdate) {
            res
                .status(403)
                .json({
                success: false,
                message: "Not authorized to update this task",
            });
            return;
        }
        if (userRole === "admin" && updateData.assignedToId === userId) {
            res.status(400).json({
                success: false,
                message: "Admin cannot assign tasks to themselves",
            });
            return;
        }
        const wasAssignedTo = task.assignedToId._id.toString();
        const isAssignmentChanging = updateData.assignedToId && updateData.assignedToId !== wasAssignedTo;
        // If assignment is changing, check if new assignee exists
        if (isAssignmentChanging) {
            const newAssignee = await user_model_1.User.findById(updateData.assignedToId);
            if (!newAssignee) {
                res
                    .status(404)
                    .json({ success: false, message: "New assignee not found" });
                return;
            }
        }
        Object.assign(task, updateData);
        await task.save();
        // Get updated task with populated fields
        const updatedTask = await task_model_1.Task.findById(id)
            .populate("creatorId", "name email")
            .populate("assignedToId", "name email");
        // Create notification for assignment change
        if (isAssignmentChanging) {
            const assigner = await user_model_1.User.findById(userId);
            await notification_model_1.Notification.create({
                userId: updateData.assignedToId,
                message: `${assigner?.name} assigned you a task: "${task.title}"`,
                type: "task_assigned",
                taskId: task._id,
                read: false,
            });
            // Notify previous assignee
            await notification_model_1.Notification.create({
                userId: wasAssignedTo,
                message: `Task "${task.title}" has been reassigned`,
                type: "task_updated",
                taskId: task._id,
                read: false,
            });
            // Emit task assigned event
            socket_service_1.socketService.emitTaskAssigned(updatedTask, assigner?.name || "Admin");
        }
        // Emit task updated event
        socket_service_1.socketService.emitTaskUpdated(updatedTask);
        logger_1.default.info(`Task updated: ${task.title} by ${userId}`);
        res.json({ success: true, data: { task: updatedTask } });
    }
    catch (error) {
        logger_1.default.error("Update task error");
        res.status(500).json({
            success: false,
            message: "Failed to update task",
        });
    }
};
exports.updateTask = updateTask;
// Delete task
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const task = await task_model_1.Task.findById(id);
        if (!task) {
            res.status(404).json({ success: false, message: "Task not found" });
            return;
        }
        const canDelete = userRole === "admin" ||
            (task.creatorId.toString() === userId && task.status === "Completed");
        if (!canDelete) {
            res.status(403).json({
                success: false,
                message: "Not authorized to delete this task. Only admins can delete any task, creators can delete their own completed tasks.",
            });
            return;
        }
        await task.deleteOne();
        await notification_model_1.Notification.deleteMany({ taskId: id });
        socket_service_1.socketService.emitTaskDeleted(id);
        logger_1.default.info(`Task deleted: ${task.title} by ${userId}`);
        res.json({ success: true, message: "Task deleted successfully" });
    }
    catch (error) {
        logger_1.default.error("Delete task error");
        res.status(500).json({ success: false, message: "Failed to delete task" });
    }
};
exports.deleteTask = deleteTask;
// Get dashboard stats
const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const query = {};
        if (userRole !== "admin") {
            query.$or = [{ creatorId: userId }, { assignedToId: userId }];
        }
        const totalTasks = await task_model_1.Task.countDocuments(query);
        const completedTasks = await task_model_1.Task.countDocuments({
            ...query,
            status: "Completed",
        });
        const overdueTasks = await task_model_1.Task.countDocuments({
            ...query,
            dueDate: { $lt: new Date() },
            status: { $ne: "Completed" },
        });
        const highPriorityTasks = await task_model_1.Task.countDocuments({
            ...query,
            priority: { $in: ["High", "Urgent"] },
        });
        const tasksByStatus = await task_model_1.Task.aggregate([
            { $match: query },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);
        const tasksByPriority = await task_model_1.Task.aggregate([
            { $match: query },
            { $group: { _id: "$priority", count: { $sum: 1 } } },
        ]);
        const recentTasks = await task_model_1.Task.find(query)
            .populate("creatorId", "name")
            .populate("assignedToId", "name")
            .sort({ createdAt: -1 })
            .limit(5);
        res.json({
            success: true,
            data: {
                stats: {
                    totalTasks,
                    completedTasks,
                    overdueTasks,
                    highPriorityTasks,
                    completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
                },
                charts: {
                    byStatus: tasksByStatus,
                    byPriority: tasksByPriority,
                },
                recentTasks,
            },
        });
    }
    catch (error) {
        logger_1.default.error("Get dashboard stats error");
        res
            .status(500)
            .json({ success: false, message: "Failed to fetch dashboard stats" });
    }
};
exports.getDashboardStats = getDashboardStats;
// Get recent tasks
const getRecentTasks = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const limit = parseInt(req.query.limit) || 5;
        const query = {};
        if (userRole !== "admin") {
            query.$or = [{ creatorId: userId }, { assignedToId: userId }];
        }
        const recentTasks = await task_model_1.Task.find(query)
            .populate("creatorId", "name email")
            .populate("assignedToId", "name email")
            .sort({ updatedAt: -1 })
            .limit(limit)
            .lean();
        // Add isOverdue flag
        const tasksWithOverdue = recentTasks.map((task) => ({
            ...task,
            isOverdue: new Date(task.dueDate) < new Date() && task.status !== "Completed",
        }));
        res.json({
            success: true,
            data: { recentTasks: tasksWithOverdue },
        });
    }
    catch (error) {
        logger_1.default.error("Get recent tasks error");
        res
            .status(500)
            .json({ success: false, message: "Failed to fetch recent tasks" });
    }
};
exports.getRecentTasks = getRecentTasks;
