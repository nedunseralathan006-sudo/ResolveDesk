import { Router } from 'express';
import { getStats, getTrends, getChannels, getPriorities } from '../controllers/dashboardController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/stats', protect, getStats);
router.get('/trends', protect, getTrends);
router.get('/channels', protect, getChannels);
router.get('/priorities', protect, getPriorities);

export default router;
