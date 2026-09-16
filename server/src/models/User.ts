import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'manager' | 'agent' | 'customer';
  phone?: string;
  avatar?: string;
  notificationPreferences: {
    email: boolean;
    assignment: boolean;
    slaBreach: boolean;
    feedback: boolean;
  };
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'manager', 'agent', 'customer'], default: 'customer' },
  phone: { type: String },
  avatar: { type: String },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    assignment: { type: Boolean, default: true },
    slaBreach: { type: Boolean, default: true },
    feedback: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password!, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
