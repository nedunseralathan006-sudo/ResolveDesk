import { Request, Response } from 'express';
import Complaint from '../models/Complaint';

export const getStats = async (req: Request, res: Response) => {
  try {
    const query: any = {};
    if (req.query.dateFrom || req.query.dateTo) {
      query.createdAt = {};
      if (req.query.dateFrom) query.createdAt.$gte = new Date(req.query.dateFrom as string);
      if (req.query.dateTo) query.createdAt.$lte = new Date(req.query.dateTo as string);
    }

    const total = await Complaint.countDocuments(query);
    const open = await Complaint.countDocuments({ ...query, status: 'Open' });
    const inProgress = await Complaint.countDocuments({ ...query, status: 'In Progress' });
    const resolved = await Complaint.countDocuments({ ...query, status: { $in: ['Resolved', 'Closed'] } });

    res.status(200).json({ total, open, inProgress, resolved });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTrends = async (req: Request, res: Response) => {
  try {
    const trends = await Complaint.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.status(200).json(trends);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getChannels = async (req: Request, res: Response) => {
  try {
    const channels = await Complaint.aggregate([
      {
        $group: {
          _id: '$channel',
          count: { $sum: 1 }
        }
      }
    ]);
    res.status(200).json(channels);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPriorities = async (req: Request, res: Response) => {
  try {
    const priorities = await Complaint.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);
    res.status(200).json(priorities);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
