import mongoose, { Document, Schema } from 'mongoose';

export interface IFeedback extends Document {
  complaintId: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
}

const feedbackSchema = new Schema<IFeedback>({
  complaintId: { type: Schema.Types.ObjectId, ref: 'Complaint', required: true, unique: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IFeedback>('Feedback', feedbackSchema);
