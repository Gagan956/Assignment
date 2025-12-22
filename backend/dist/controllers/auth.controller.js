"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.logout = exports.login = exports.register = void 0;
const user_model_1 = require("../models/user.model");
const jwt_1 = require("../utils/jwt");
const logger_1 = __importDefault(require("../utils/logger"));
// Register a new user
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        // Check if user exists
        const existingUser = await user_model_1.User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ success: false, message: 'User already exists' });
            return;
        }
        // Create user
        const user = await user_model_1.User.create({
            name,
            email,
            password,
            role: role || 'user'
        });
        // Generate token
        const token = (0, jwt_1.generateToken)(user);
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
        logger_1.default.info(`User registered: ${user.email}`);
        res.status(201).json({
            success: true,
            data: { user: userResponse, token }
        });
    }
    catch (error) {
        logger_1.default.error('Registration error');
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
};
exports.register = register;
// Login a user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find user
        const user = await user_model_1.User.findOne({ email }).select('+password');
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
        const token = (0, jwt_1.generateToken)(user);
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
        logger_1.default.info(`User logged in: ${user.email}`);
        res.json({
            success: true,
            data: { user: userResponse, token }
        });
    }
    catch (error) {
        logger_1.default.error('Login error');
        res.status(500).json({ success: false, message: 'Login failed' });
    }
};
exports.login = login;
// Logout a user
const logout = async (req, res) => {
    try {
        res.clearCookie('token');
        logger_1.default.info('User logged out');
        res.json({ success: true, message: 'Logged out successfully' });
    }
    catch (error) {
        logger_1.default.error('Logout error');
        res.status(500).json({ success: false, message: 'Logout failed' });
    }
};
exports.logout = logout;
// Get current user
const getCurrentUser = async (req, res) => {
    try {
        const user = await user_model_1.User.findById(req.user?.userId).select('-password');
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        res.json({ success: true, data: { user } });
    }
    catch (error) {
        logger_1.default.error('Get current user error');
        res.status(500).json({ success: false, message: 'Failed to get user' });
    }
};
exports.getCurrentUser = getCurrentUser;
