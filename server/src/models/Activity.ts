import mongoose, { Document, Schema } from 'mongoose';

export interface IActivity extends Document {
  complaintId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  type: 'created' | 'status_change' | 'assigned' | 'priority_change' | 'escalated' | 'comment' | 'feedback' | 'resolved' | 'closed';
  message: string;
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>({
  complaintId: { type: Schema.Types.ObjectId, ref: 'Complaint', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['created', 'status_change', 'assigned', 'priority_change', 'escalated', 'comment', 'feedback', 'resolved', 'closed'], required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IActivity>('Activity', activitySchema);
