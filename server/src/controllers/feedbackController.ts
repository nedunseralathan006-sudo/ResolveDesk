import { Request, Response } from 'express';
import Feedback from '../models/Feedback';
import Complaint from '../models/Complaint';
import Activity from '../models/Activity';
import { AuthRequest } from '../middleware/auth';

export const submitFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const complaintId = req.params.complaintId;
    const complaint = await Complaint.findById(complaintId);
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (complaint.status !== 'Resolved' && complaint.status !== 'Closed') {
      return res.status(400).json({ message: 'Complaint must be resolved or closed to submit feedback' });
    }

    const existingFeedback = await Feedback.findOne({ complaintId });
    if (existingFeedback) {
      return res.status(400).json({ message: 'Feedback already submitted for this complaint' });
    }

    const feedback = await Feedback.create({
      complaintId,
      rating,
      comment
    });

    await Activity.create({
      complaintId,
      userId: req.user?._id,
      type: 'feedback',
      message: `Feedback submitted with rating: ${rating}`
    });

    res.status(201).json(feedback);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getFeedback = async (req: Request, res: Response) => {
  try {
    const feedback = await Feedback.findOne({ complaintId: req.params.complaintId });
    res.status(200).json(feedback);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
