import { Request, Response } from 'express';
import Complaint from '../models/Complaint';
import Activity from '../models/Activity';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';

export const getComplaints = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const startIndex = (page - 1) * limit;

    const query: any = {};
    if (req.user?.role === 'customer') {
      query.customerId = req.user._id;
    }

    if (req.query.status) query.status = req.query.status;
    if (req.query.category) query.category = req.query.category;
    if (req.query.channel) query.channel = req.query.channel;
    if (req.query.priority) query.priority = req.query.priority;

    if (req.query.search) {
      const search = req.query.search as string;
      query.$or = [
        { subject: new RegExp(search, 'i') },
        { customerName: new RegExp(search, 'i') },
        { complaintId: new RegExp(search, 'i') }
      ];
    }

    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({ complaints, total, page, pages: Math.ceil(total / limit) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getComplaintById = async (req: AuthRequest, res: Response) => {
  try {
    const query: any = req.params.id.startsWith('C-') ? { complaintId: req.params.id } : { _id: req.params.id };
    if (req.user?.role === 'customer') {
      query.customerId = req.user._id;
    }
    const complaint = await Complaint.findOne(query).populate('assignedTo', 'name email avatar');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.status(200).json(complaint);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createComplaint = async (req: AuthRequest, res: Response) => {
  try {
    const data = { ...req.body };
    if (req.user?.role === 'customer') {
      data.customerId = req.user._id;
      data.customerName = req.user.name;
      data.contactInformation = req.user.email + (req.user.phone ? `\n${req.user.phone}` : '');
    }
    const complaint = await Complaint.create(data);

    await Activity.create({
      complaintId: complaint._id,
      userId: req.user?._id,
      type: 'created',
      message: 'Complaint created'
    });

    res.status(201).json(complaint);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateComplaint = async (req: Request, res: Response) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    res.status(200).json(complaint);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteComplaint = async (req: Request, res: Response) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    await Activity.deleteMany({ complaintId: req.params.id });
    res.status(200).json({ message: 'Complaint deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const assignComplaint = async (req: AuthRequest, res: Response) => {
  try {
    const { assignedTo } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, { assignedTo }, { new: true });
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    await Activity.create({
      complaintId: complaint._id,
      userId: req.user?._id,
      type: 'assigned',
      message: `Complaint assigned to user`
    });

    if (assignedTo) {
      await Notification.create({
        userId: assignedTo,
        message: `You have been assigned to complaint ${complaint.complaintId}`,
        type: 'assignment',
        complaintId: complaint._id
      });
    }

    res.status(200).json(complaint);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const changeStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const oldStatus = complaint.status;
    complaint.status = status;
    
    if (status === 'Resolved') complaint.resolvedAt = new Date();
    if (status === 'Closed') complaint.closedAt = new Date();
    if (status === 'Escalated') complaint.escalatedAt = new Date();

    await complaint.save();

    await Activity.create({
      complaintId: complaint._id,
      userId: req.user?._id,
      type: 'status_change',
      message: `Status changed from ${oldStatus} to ${status}`
    });

    if (complaint.assignedTo) {
      await Notification.create({
        userId: complaint.assignedTo,
        message: `Complaint ${complaint.complaintId} status changed to ${status}`,
        type: 'status_change',
        complaintId: complaint._id
      });
    }

    res.status(200).json(complaint);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const changePriority = async (req: AuthRequest, res: Response) => {
  try {
    const { priority } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const oldPriority = complaint.priority;
    complaint.priority = priority;
    // SLA recalculation happens in pre-save hook
    await complaint.save();

    await Activity.create({
      complaintId: complaint._id,
      userId: req.user?._id,
      type: 'priority_change',
      message: `Priority changed from ${oldPriority} to ${priority}`
    });

    res.status(200).json(complaint);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
