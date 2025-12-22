import express from 'express';
import { updateProfile, getAllUsers } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate, userSchemas } from '../middleware/validation.middleware';

const router = express.Router();

router.use(authenticate);

router.put('/profile', validate(userSchemas.updateProfile), updateProfile);
router.get('/all', authorize('admin'), getAllUsers);

export default router;