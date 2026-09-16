import { Router } from 'express';
import { getCustomers } from '../controllers/customerController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.get('/', protect, authorize('admin', 'manager', 'agent'), getCustomers);

export default router;
