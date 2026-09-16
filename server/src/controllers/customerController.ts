import { Request, Response } from 'express';
import User from '../models/User';

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const match: any = { role: 'customer' };
    if (req.query.search) {
      match.$or = [
        { name: new RegExp(req.query.search as string, 'i') },
        { email: new RegExp(req.query.search as string, 'i') },
        { phone: new RegExp(req.query.search as string, 'i') }
      ];
    }

    const customers = await User.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'complaints',
          localField: '_id',
          foreignField: 'customerId',
          as: 'complaints'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          createdAt: 1,
          totalComplaints: { $size: '' }
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    const total = await User.countDocuments(match);

    res.status(200).json({ customers, total, page, pages: Math.ceil(total / limit) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
