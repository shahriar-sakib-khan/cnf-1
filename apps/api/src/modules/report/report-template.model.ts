import mongoose, { Schema, Document, Types } from 'mongoose';
import { InvoiceType } from '@repo/shared';

export interface IReportTemplate extends Document {
  tenantId: Types.ObjectId;
  type: InvoiceType;
  items: { id: string; description: string; subDescriptions?: string[]; subWidths?: number[] }[];
  createdAt: Date;
  updatedAt: Date;
}

const ReportTemplateSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  type: { type: String, enum: ['PDA', 'FDA'], required: true },
  items: [{
    id: { type: String, required: true },
    description: { type: String, required: true, trim: true },
    subDescriptions: [{ type: String, trim: true }],
    subWidths: [{ type: Number }]
  }]
}, { timestamps: true });

// Ensure one template per type per tenant
ReportTemplateSchema.index({ tenantId: 1, type: 1 }, { unique: true });

export const ReportTemplateModel = mongoose.models.ReportTemplate || mongoose.model<IReportTemplate>('ReportTemplate', ReportTemplateSchema);
