import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IClient extends Document {
  tenantId: Types.ObjectId;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  type: 'IMPORTER' | 'EXPORTER' | 'BOTH';
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  address: { type: String, trim: true },
  type: { type: String, enum: ['IMPORTER', 'EXPORTER', 'BOTH'], required: true },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date }
}, { timestamps: true });

// Prevent duplicate client names within the same tenant, taking soft deletion into account
ClientSchema.index({ tenantId: 1, name: 1, deletedAt: 1 }, { unique: true });

// Optimize pagination and querying active clients
ClientSchema.index({ tenantId: 1, isDeleted: 1, createdAt: -1 });

export const ClientModel = mongoose.model<IClient>('Client', ClientSchema);
