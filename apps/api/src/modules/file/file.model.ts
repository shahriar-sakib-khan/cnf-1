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

  exporterName?: string;
  copyDocsReceived: boolean;
  originalDocsReceived: boolean;

  // Customs info
  boeNumber?: string;
  beDate?: Date;
  cNumber?: string;
  cDate?: Date;
  assessmentValue?: number;
  customsLane?: 'GREEN' | 'YELLOW' | 'RED';

  // Financial Docs
  lcNumber?: string;
  lcDate?: Date;
  piNumber?: string;

  // Cargo Details
  countryOfOrigin?: string;
  containerType?: 'FCL' | 'LCL';
  packageType?: 'PACKAGE' | 'PX' | 'ROLL' | 'BALE' | 'CASE' | 'CARTON' | 'DRUM' | 'BAG' | 'OTHER';

  // Logistics
  deliveryOrderStatus: boolean;
  portBillPaid: boolean;
  gatePassNo?: string;
  exitDate?: Date;

  containerNumbers?: string;

  vesselName?: string;
  voyageNo?: string;
  rotationNo?: string;
  igmNo?: string;
  igmDate?: Date;
  arrivalDate?: Date;

  assessment: {
    currentNode?: string;
    nodes: Array<{
      node: string;
      status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'SKIPPED';
      enteredAt?: Date;
      completedAt?: Date;
      notes?: string;
    }>;
  };

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

  exporterName: { type: String, trim: true },
  copyDocsReceived: { type: Boolean, default: false },
  originalDocsReceived: { type: Boolean, default: false },

  // Customs info
  boeNumber: { type: String, trim: true },
  beDate: { type: Date },
  cNumber: { type: String, trim: true },
  cDate: { type: Date },
  assessmentValue: { type: Number },
  customsLane: { type: String, enum: ['GREEN', 'YELLOW', 'RED'] },

  // Financial Docs
  lcNumber: { type: String, trim: true },
  lcDate: { type: Date },
  piNumber: { type: String, trim: true },

  // Cargo Details
  countryOfOrigin: { type: String, trim: true },
  containerType: { type: String, enum: ['FCL', 'LCL'] },
  packageType: { type: String, enum: ['PACKAGE', 'PX', 'ROLL', 'BALE', 'CASE', 'CARTON', 'DRUM', 'BAG', 'OTHER'] },

  // Logistics
  deliveryOrderStatus: { type: Boolean, default: false },
  portBillPaid: { type: Boolean, default: false },
  gatePassNo: { type: String, trim: true },
  exitDate: { type: Date },

  containerNumbers: { type: String, trim: true },

  vesselName: { type: String, trim: true },
  voyageNo: { type: String, trim: true },
  rotationNo: { type: String, trim: true },
  igmNo: { type: String, trim: true },
  igmDate: { type: Date },
  arrivalDate: { type: Date },

  assessment: {
    currentNode: { type: String },
    nodes: [{
      node: { type: String, required: true },
      status: { type: String, enum: ['PENDING', 'ACTIVE', 'COMPLETED', 'SKIPPED'], default: 'PENDING' },
      enteredAt: { type: Date },
      completedAt: { type: Date },
      notes: { type: String }
    }]
  },

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

// ── File History Model ──────────────────────────────────
export interface IFileHistory extends Document {
  tenantId: Types.ObjectId;
  fileId: Types.ObjectId;
  statusFrom?: FileStatus;
  statusTo: FileStatus;
  changedBy: Types.ObjectId;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const FileHistorySchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  fileId: { type: Schema.Types.ObjectId, ref: 'File', required: true, index: true },
  statusFrom: { type: String },
  statusTo: { type: String, required: true },
  changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  notes: { type: String, trim: true },
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: { createdAt: true, updatedAt: false } });

FileHistorySchema.index({ tenantId: 1, fileId: 1, createdAt: -1 });

// ── File Document Model ─────────────────────────────────
export interface IFileDocument extends Document {
  tenantId: Types.ObjectId;
  fileId: Types.ObjectId;
  name: string;
  url: string;
  type: string; // e.g., 'BL', 'INVOICE', 'PACKING_LIST'
  category: 'COPY' | 'ORIGINAL';
  size?: number;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
}

const FileDocumentSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  fileId: { type: Schema.Types.ObjectId, ref: 'File', required: true, index: true },
  name: { type: String, required: true, trim: true },
  url: { type: String, required: true },
  type: { type: String, required: true },
  category: { type: String, enum: ['COPY', 'ORIGINAL'], required: true, default: 'COPY' },
  size: { type: Number },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: { createdAt: true, updatedAt: false } });

FileDocumentSchema.index({ tenantId: 1, fileId: 1, createdAt: -1 });

export const FileModel = mongoose.models.File || mongoose.model<IFile>('File', FileSchema);
export const FileHistoryModel = mongoose.models.FileHistory || mongoose.model<IFileHistory>('FileHistory', FileHistorySchema);
export const FileDocumentModel = mongoose.models.FileDocument || mongoose.model<IFileDocument>('FileDocument', FileDocumentSchema);
