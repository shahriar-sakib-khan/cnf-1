import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IExpenseCategory extends Document {
  tenantId: Types.ObjectId;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseCategorySchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  name: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Ensure unique name per tenant
ExpenseCategorySchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const ExpenseCategoryModel = mongoose.models.ExpenseCategory || mongoose.model<IExpenseCategory>('ExpenseCategory', ExpenseCategorySchema);
