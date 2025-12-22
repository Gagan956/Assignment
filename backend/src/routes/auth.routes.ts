import express from 'express';
import { register, login, logout, getCurrentUser } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate, authSchemas } from '../middleware/validation.middleware';

const router = express.Router();

router.post('/register', validate(authSchemas.register), register);
router.post('/login', validate(authSchemas.login), login);
router.post('/logout', logout);
router.get('/me', authenticate, getCurrentUser);

export default router;