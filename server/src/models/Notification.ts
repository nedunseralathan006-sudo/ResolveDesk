import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  message: string;
  type: 'assignment' | 'status_change' | 'sla_warning' | 'sla_breach' | 'feedback' | 'escalation';
  read: boolean;
  complaintId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['assignment', 'status_change', 'sla_warning', 'sla_breach', 'feedback', 'escalation'], required: true },
  read: { type: Boolean, default: false },
  complaintId: { type: Schema.Types.ObjectId, ref: 'Complaint' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<INotification>('Notification', notificationSchema);
