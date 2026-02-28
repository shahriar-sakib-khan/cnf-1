import mongoose, { Schema, Document, Types } from 'mongoose';
import { FileStatus } from '@repo/shared';

export interface IFile extends Document {
  tenantId: Types.ObjectId;
  fileNo: number; // Numeric part for auto-increment
  fileNoFull: string; // e.g., IMP-EXP-1001
  clientId: Types.ObjectId;

  blNo: string;
  blDate: Date;

  invoiceValue: number; // Taka
  currency: string;
  hsCode?: string;
  description: string;

  quantity?: number;
  weight?: number;

  vesselName?: string;
  voyageNo?: string;
  rotationNo?: string;
  igmNo?: string;
  igmDate?: Date;
  arrivalDate?: Date;

  status: FileStatus;

  isDeleted: boolean;
  deletedAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  fileNo: { type: Number, required: true },
  fileNoFull: { type: String, required: true, unique: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },

  blNo: { type: String, required: true, trim: true },
  blDate: { type: Date, required: true },

  invoiceValue: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  hsCode: { type: String, trim: true },
  description: { type: String, required: true, trim: true },

  quantity: { type: Number },
  weight: { type: Number },

  vesselName: { type: String, trim: true },
  voyageNo: { type: String, trim: true },
  rotationNo: { type: String, trim: true },
  igmNo: { type: String, trim: true },
  igmDate: { type: Date },
  arrivalDate: { type: Date },

  status: {
    type: String,
    enum: [
      'CREATED', 'IGM_RECEIVED', 'BE_FILED', 'UNDER_ASSESSMENT',
      'ASSESSMENT_COMPLETE', 'DUTY_PAID', 'DELIVERED', 'BILLED', 'ARCHIVED'
    ],
    default: 'CREATED'
  },

  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Index for multi-tenant unique file numbers
FileSchema.index({ tenantId: 1, fileNo: 1 }, { unique: true });

// Optimize common filters
FileSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
FileSchema.index({ tenantId: 1, isDeleted: 1, createdAt: -1 });

export const FileModel = mongoose.model<IFile>('File', FileSchema);
