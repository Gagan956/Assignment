"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanager';
        logger_1.default.info(`Connecting to MongoDB...`);
        await mongoose_1.default.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        logger_1.default.info(' MongoDB connected successfully');
        // Connection events
        mongoose_1.default.connection.on('connected', () => {
            logger_1.default.info('Mongoose connected to DB');
        });
        mongoose_1.default.connection.on('error', (err) => {
            logger_1.default.error('Mongoose connection error:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.default.warn('Mongoose disconnected from DB');
        });
    }
    catch (error) {
        logger_1.default.error(' MongoDB connection failed');
        process.exit(1);
    }
};
exports.connectDB = connectDB;
