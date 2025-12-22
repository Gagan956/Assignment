import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
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

// Schemas
export const authSchemas = {
  register: Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('user', 'admin')
  }),

  login: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string().required()
  })
};

export const taskSchemas = {
  create: Joi.object({
    title: Joi.string().trim().max(100).required(),
    description: Joi.string().trim().required(),
    dueDate: Joi.date().iso().greater('now').required(),
    priority: Joi.string().valid('Low', 'Medium', 'High', 'Urgent').required(),
    status: Joi.string().valid('To Do', 'In Progress', 'Review', 'Completed'),
    assignedToId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
  }),

  update: Joi.object({
    title: Joi.string().trim().max(100),
    description: Joi.string().trim(),
    dueDate: Joi.date().iso(),
    priority: Joi.string().valid('Low', 'Medium', 'High', 'Urgent'),
    status: Joi.string().valid('To Do', 'In Progress', 'Review', 'Completed'),
    assignedToId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
  }).min(1)
};

export const userSchemas = {
  updateProfile: Joi.object({
    name: Joi.string().trim().min(2).max(50)
  }).min(1)
};