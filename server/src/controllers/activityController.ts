import { Request, Response } from 'express';
import Activity from '../models/Activity';
import Complaint from '../models/Complaint';
import { AuthRequest } from '../middleware/auth';

export const getActivities = async (req: Request, res: Response) => {
  try {
    const activities = await Activity.find({ complaintId: req.params.complaintId })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 });
    res.status(200).json(activities);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const complaint = await Complaint.findById(req.params.complaintId);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const activity = await Activity.create({
      complaintId: req.params.complaintId,
      userId: req.user?._id,
      type: 'comment',
      message
    });

    res.status(201).json(activity);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
