import { Router } from 'express';
import { getUsers, getAgents, updateProfile, updateNotificationPreferences, createUser, updateUser, deleteUser } from '../controllers/userController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.get('/', protect, authorize('admin', 'manager'), getUsers);
router.post('/', protect, authorize('admin', 'manager'), createUser);
router.put('/:id', protect, authorize('admin', 'manager'), updateUser);
router.delete('/:id', protect, authorize('admin', 'manager'), deleteUser);

router.get('/agents', protect, getAgents);
router.put('/profile', protect, updateProfile);
router.put('/notification-preferences', protect, updateNotificationPreferences);

export default router;
