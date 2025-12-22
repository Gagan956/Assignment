"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = exports.updateProfile = void 0;
const user_model_1 = require("../models/user.model");
const logger_1 = __importDefault(require("../utils/logger"));
// update profile
const updateProfile = async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user.userId;
        const user = await user_model_1.User.findByIdAndUpdate(userId, { name }, { new: true, runValidators: true }).select('-password');
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        logger_1.default.info(`Profile updated for user: ${userId}`);
        res.json({ success: true, data: { user } });
    }
    catch (error) {
        logger_1.default.error('Update profile error');
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
};
exports.updateProfile = updateProfile;
// get all users
const getAllUsers = async (req, res) => {
    try {
        const users = await user_model_1.User.find().select('-password').sort({ name: 1 });
        res.json({ success: true, data: { users } });
    }
    catch (error) {
        logger_1.default.error('Get all users error');
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
};
exports.getAllUsers = getAllUsers;
