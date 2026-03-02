import mongoose, { Schema, Document, Types } from 'mongoose';
import { RequestStatus } from '@repo/shared';

// ── Money Request Model ──────────────────────────────────
export interface IMoneyRequest extends Document {
  tenantId: Types.ObjectId;
  staffId: Types.ObjectId;
  amount: number;         // Requested amount
  grantedAmount?: number; // Actual amount granted (may differ)
  purpose: string;
  fileId?: Types.ObjectId;
  status: RequestStatus;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  receiptUrl?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MoneyRequestSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  staffId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount: { type: Number, required: true },
  grantedAmount: { type: Number }, // Set on approval — may differ from requested
  purpose: { type: String, trim: true },
  fileId: { type: Schema.Types.ObjectId, ref: 'File', index: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'SETTLED', 'REJECTED'], default: 'PENDING' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  receiptUrl: { type: String },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

// Index for listing a staff member's requests
MoneyRequestSchema.index({ tenantId: 1, staffId: 1, createdAt: -1 });

// ── Expense Model ────────────────────────────────────────
export interface IExpense extends Document {
  tenantId: Types.ObjectId;
  staffId: Types.ObjectId;
  fileId?: Types.ObjectId;
  amount: number;
  category: Types.ObjectId;
  description: string;
  receiptUrl?: string;
  requestId?: Types.ObjectId; // Linked back to the request that funded this
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  staffId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fileId: { type: Schema.Types.ObjectId, ref: 'File', index: true },
  amount: { type: Number, required: true },
  category: { type: Schema.Types.ObjectId, ref: 'ExpenseCategory', required: true },
  description: { type: String, required: false, trim: true },
  receiptUrl: { type: String },
  requestId: { type: Schema.Types.ObjectId, ref: 'MoneyRequest' },
}, { timestamps: true });

// Index for listing expenses by file
ExpenseSchema.index({ tenantId: 1, fileId: 1, createdAt: -1 });

// ── Ledger Event Model (Immutable Log) ────────────────────
export interface ILedgerEvent extends Document {
  tenantId: Types.ObjectId;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  fromId?: Types.ObjectId; // User ID or Store ID
  toId?: Types.ObjectId;   // User ID
  refId: Types.ObjectId;   // Reference to MoneyRequest or Expense
  refType: 'MoneyRequest' | 'Expense';
  description: string;
  createdAt: Date;
}

const LedgerEventSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  type: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
  amount: { type: Number, required: true },
  fromId: { type: Schema.Types.ObjectId, ref: 'User' },
  toId: { type: Schema.Types.ObjectId, ref: 'User' },
  refId: { type: Schema.Types.ObjectId, required: true },
  refType: { type: String, enum: ['MoneyRequest', 'Expense'], required: true },
  description: { type: String, required: true },
}, { timestamps: false }); // Immutable, createdAt only

LedgerEventSchema.add({ createdAt: { type: Date, default: Date.now, index: true } });

export const MoneyRequestModel = mongoose.models.MoneyRequest || mongoose.model<IMoneyRequest>('MoneyRequest', MoneyRequestSchema);
export const ExpenseModel = mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);
export const LedgerEventModel = mongoose.models.LedgerEvent || mongoose.model<ILedgerEvent>('LedgerEvent', LedgerEventSchema);
