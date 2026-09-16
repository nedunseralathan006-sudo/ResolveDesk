import { Router } from 'express';
import { getActivities, addActivity } from '../controllers/activityController';
import { protect } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.route('/')
  .get(protect, getActivities)
  .post(protect, addActivity);

export default router;
