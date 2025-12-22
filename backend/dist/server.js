"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server.ts
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const app_1 = __importDefault(require("./app"));
const socket_service_1 = require("./socket/socket.service");
const logger_1 = __importDefault(require("./utils/logger"));
// Load environment variables
dotenv_1.default.config();
const PORT = process.env.PORT || 5000;
// Connect to database
(0, database_1.connectDB)();
// Create HTTP server
const server = http_1.default.createServer(app_1.default);
// Initialize Socket.IO
socket_service_1.socketService.initialize(server);
// Start server
server.listen(PORT, () => {
    logger_1.default.info(`Server is running on port ${PORT}`);
    logger_1.default.info(`Health Check: http://localhost:${PORT}/health`);
});
// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        logger_1.default.error(`Port ${PORT} is already in use`);
        process.exit(1);
    }
    else {
        logger_1.default.error('Server error:', error);
    }
});
// Graceful shutdown
const shutdown = () => {
    logger_1.default.info('Received shutdown signal. Gracefully shutting down...');
    server.close(() => {
        logger_1.default.info('Server closed');
        process.exit(0);
    });
    // Force shutdown after 10 seconds
    setTimeout(() => {
        logger_1.default.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('unhandledRejection', (reason, promise) => {
    logger_1.default.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
    logger_1.default.error('Uncaught Exception:', error);
});
