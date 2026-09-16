import { Request, Response } from 'express';
import Complaint from '../models/Complaint';

export const getSlaData = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const startIndex = (page - 1) * limit;

    const complaints = await Complaint.find({ status: { $nin: ['Resolved', 'Closed'] } })
      .populate('assignedTo', 'name email')
      .skip(startIndex)
      .limit(limit);
      
    const total = await Complaint.countDocuments({ status: { $nin: ['Resolved', 'Closed'] } });

    const slaData = complaints.map(complaint => {
      const now = new Date();
      const deadline = new Date(complaint.slaDeadline);
      const remainingTime = deadline.getTime() - now.getTime();
      let slaStatus = 'Within SLA';
      
      if (remainingTime < 0) {
        slaStatus = 'Breached';
      } else if (remainingTime < 2 * 60 * 60 * 1000) { // Less than 2 hours
        slaStatus = 'At Risk';
      }

      return {
        complaint,
        slaDeadline: deadline,
        remainingTime,
        slaStatus
      };
    });

    res.status(200).json({ data: slaData, total, page, pages: Math.ceil(total / limit) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSlaReports = async (req: Request, res: Response) => {
  try {
    const complaints = await Complaint.find({});
    
    let withinSla = 0;
    let breached = 0;
    let totalResolutionTime = 0;
    let resolvedCount = 0;

    complaints.forEach(c => {
      if (c.status === 'Resolved' || c.status === 'Closed') {
        const resolvedAt = c.resolvedAt || c.closedAt || new Date();
        const created = c.createdAt;
        totalResolutionTime += (resolvedAt.getTime() - created.getTime());
        resolvedCount++;

        if (resolvedAt <= new Date(c.slaDeadline)) {
          withinSla++;
        } else {
          breached++;
        }
      } else {
        if (new Date() > new Date(c.slaDeadline)) {
          breached++;
        } else {
          withinSla++; // Or calculate atRisk
        }
      }
    });

    const avgResolutionTime = resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0;

    res.status(200).json({
      total: complaints.length,
      withinSla,
      breached,
      avgResolutionTime
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
