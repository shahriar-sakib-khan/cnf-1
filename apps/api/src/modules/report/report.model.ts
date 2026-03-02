import mongoose, { Schema, Document, Types } from 'mongoose';
import { InvoiceType } from '@repo/shared';

export interface IInvoice extends Document {
  tenantId: Types.ObjectId;
  fileId: Types.ObjectId;
  type: InvoiceType;
  details?: {
    refNo?: string;
    date?: string;
    vesselName?: string;
    voyage?: string;
    eta?: string;
    grt?: string;
    nrt?: string;
    cargo?: string;
    berthing?: string;
    departure?: string;
    quantity?: string;
    bankingDetails?: string;
  };
  items: { id: string; description: string; amount: number; isPermanent?: boolean }[];
  totalAmount: number;
  notes?: string;
  isPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  fileId: { type: Schema.Types.ObjectId, ref: 'File', required: true, index: true },
  type: { type: String, enum: ['PDA', 'FDA'], required: true },
  details: {
    refNo: { type: String, trim: true },
    date: { type: String, trim: true },
    vesselName: { type: String, trim: true },
    voyage: { type: String, trim: true },
    eta: { type: String, trim: true },
    grt: { type: String, trim: true },
    nrt: { type: String, trim: true },
    cargo: { type: String, trim: true },
    berthing: { type: String, trim: true },
    departure: { type: String, trim: true },
    quantity: { type: String, trim: true },
    bankingDetails: { type: String, trim: true },
  },
  items: [{
    id: { type: String, required: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    isPermanent: { type: Boolean, default: false }
  }],
  totalAmount: { type: Number, required: true },
  notes: { type: String, trim: true },
  isPaid: { type: Boolean, default: false }
}, { timestamps: true });

// Ensure one initial and one final invoice per file per tenant
InvoiceSchema.index({ tenantId: 1, fileId: 1, type: 1 }, { unique: true });

export const InvoiceModel = mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
