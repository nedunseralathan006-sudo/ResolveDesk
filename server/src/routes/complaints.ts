import { Router } from 'express';
import {
  getComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  deleteComplaint,
  assignComplaint,
  changeStatus,
  changePriority
} from '../controllers/complaintController';
import { protect, authorize } from '../middleware/auth';
import activityRoutes from './activities';
import feedbackRoutes from './feedback';

const router = Router();

router.use('/:complaintId/activities', activityRoutes);
router.use('/:complaintId/feedback', feedbackRoutes);

router.route('/')
  .get(protect, getComplaints)
  .post(protect, createComplaint);

router.route('/:id')
  .get(protect, getComplaintById)
  .put(protect, authorize('admin', 'manager', 'agent'), updateComplaint)
  .delete(protect, authorize('admin', 'manager'), deleteComplaint);

router.put('/:id/assign', protect, authorize('admin', 'manager'), assignComplaint);
router.put('/:id/status', protect, authorize('admin', 'manager', 'agent'), changeStatus);
router.put('/:id/priority', protect, authorize('admin', 'manager', 'agent'), changePriority);

export default router;
