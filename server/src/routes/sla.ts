import { Router } from 'express';
import { getSlaData, getSlaReports } from '../controllers/slaController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/', protect, getSlaData);
router.get('/reports', protect, getSlaReports);

export default router;
