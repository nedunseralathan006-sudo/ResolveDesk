import mongoose, { Document, Schema } from 'mongoose';

export interface IComplaint extends Document {
  complaintId: string;
  customerName: string;
  contactInformation: string;
  category: 'Product Issue' | 'Billing' | 'Account' | 'Feature Request' | 'Technical Issue' | 'Service Issue' | 'Other';
  subject: string;
  description: string;
  channel: 'Website' | 'Email' | 'Phone' | 'Mobile App' | 'In-Person' | 'Other';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Escalated' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTo?: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  slaDeadline: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  escalatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const complaintSchema = new Schema<IComplaint>({
  complaintId: { type: String, unique: true },
  customerName: { type: String, required: true },
  contactInformation: { type: String, required: true },
  category: { type: String, enum: ['Product Issue', 'Billing', 'Account', 'Feature Request', 'Technical Issue', 'Service Issue', 'Other'], required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  channel: { type: String, enum: ['Website', 'Email', 'Phone', 'Mobile App', 'In-Person', 'Other'], required: true },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Escalated', 'Closed'], default: 'Open' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  customerId: { type: Schema.Types.ObjectId, ref: 'User' },
  slaDeadline: { type: Date },
  resolvedAt: { type: Date },
  closedAt: { type: Date },
  escalatedAt: { type: Date }
}, { timestamps: true });

complaintSchema.pre<IComplaint>('save', async function(next) {
  if (!this.complaintId) {
    try {
      const maxComplaint = await mongoose.model('Complaint').findOne({}, {}, { sort: { complaintId: -1 } });
      let nextIdNumber = 1;
      if (maxComplaint && maxComplaint.complaintId) {
        const match = maxComplaint.complaintId.match(/^C-(\d{5})$/);
        if (match) {
          nextIdNumber = parseInt(match[1], 10) + 1;
        }
      }
      this.complaintId = `C-${nextIdNumber.toString().padStart(5, '0')}`;
    } catch (err: any) {
      return next(err);
    }
  }

  if (this.isModified('priority') || this.isNew) {
    const now = this.createdAt || new Date();
    const hours = {
      'Critical': 4,
      'High': 8,
      'Medium': 24,
      'Low': 48
    }[this.priority] || 24;
    this.slaDeadline = new Date(now.getTime() + hours * 60 * 60 * 1000);
  }
  next();
});

export default mongoose.model<IComplaint>('Complaint', complaintSchema);
