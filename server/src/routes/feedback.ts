import { Router } from 'express';
import { submitFeedback, getFeedback } from '../controllers/feedbackController';
import { protect } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.route('/')
  .post(protect, submitFeedback)
  .get(protect, getFeedback);

export default router;
