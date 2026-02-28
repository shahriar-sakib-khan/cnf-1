import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  userType: 'ADMIN' | 'USER';
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  storeId?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  isActive: boolean;
  tokenVersion: number;
  balanceTaka: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema({
  name: { type: String, required: false, trim: true }, // Optional, can use identifier or name
  email: {
    type: String,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  password: { type: String, required: true, select: false },
  userType: { type: String, enum: ['ADMIN', 'USER'], default: 'USER' },
  role: { type: String, enum: ['OWNER', 'MANAGER', 'STAFF'], default: 'OWNER' },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', index: true },
  isActive: { type: Boolean, default: true },
  tokenVersion: { type: Number, default: 0 },
  balanceTaka: { type: Number, default: 0 },
}, { timestamps: true });

// Ensure email and phone are unique when present
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });
// Efficient per-store staff listing
UserSchema.index({ storeId: 1, role: 1 });

export const UserModel = mongoose.model<IUser>('User', UserSchema);
