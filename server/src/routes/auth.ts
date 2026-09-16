import { Router } from 'express';
import { login, register, getMe, changePassword } from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);

export default router;
