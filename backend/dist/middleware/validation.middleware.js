"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSchemas = exports.taskSchemas = exports.authSchemas = exports.validate = void 0;
const joi_1 = __importDefault(require("joi"));
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message.replace(/['"]/g, '')
            }));
            res.status(400).json({ success: false, errors });
            return;
        }
        next();
    };
};
exports.validate = validate;
// Schemas
exports.authSchemas = {
    register: joi_1.default.object({
        name: joi_1.default.string().trim().min(2).max(50).required(),
        email: joi_1.default.string().email().lowercase().trim().required(),
        password: joi_1.default.string().min(6).required(),
        role: joi_1.default.string().valid('user', 'admin')
    }),
    login: joi_1.default.object({
        email: joi_1.default.string().email().lowercase().trim().required(),
        password: joi_1.default.string().required()
    })
};
exports.taskSchemas = {
    create: joi_1.default.object({
        title: joi_1.default.string().trim().max(100).required(),
        description: joi_1.default.string().trim().required(),
        dueDate: joi_1.default.date().iso().greater('now').required(),
        priority: joi_1.default.string().valid('Low', 'Medium', 'High', 'Urgent').required(),
        status: joi_1.default.string().valid('To Do', 'In Progress', 'Review', 'Completed'),
        assignedToId: joi_1.default.string().pattern(/^[0-9a-fA-F]{24}$/).required()
    }),
    update: joi_1.default.object({
        title: joi_1.default.string().trim().max(100),
        description: joi_1.default.string().trim(),
        dueDate: joi_1.default.date().iso(),
        priority: joi_1.default.string().valid('Low', 'Medium', 'High', 'Urgent'),
        status: joi_1.default.string().valid('To Do', 'In Progress', 'Review', 'Completed'),
        assignedToId: joi_1.default.string().pattern(/^[0-9a-fA-F]{24}$/)
    }).min(1)
};
exports.userSchemas = {
    updateProfile: joi_1.default.object({
        name: joi_1.default.string().trim().min(2).max(50)
    }).min(1)
};
