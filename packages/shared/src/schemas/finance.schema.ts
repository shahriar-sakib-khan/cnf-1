import { z } from 'zod';

export const RequestStatusSchema = z.enum(['PENDING', 'APPROVED', 'SETTLED', 'REJECTED']);
export type RequestStatus = z.infer<typeof RequestStatusSchema>;

export const ExpenseCategorySchema = z.enum([
  'DUTY',
  'VAT_AIT',
  'PORT_CHARGES',
  'SHIPPING_LINE',
  'TRANSPORT',
  'LABOR',
  'CHA_FEES',
  'MISCELLANEOUS',
]);
export type ExpenseCategory = z.infer<typeof ExpenseCategorySchema>;

export const MoneyRequestSchema = z.object({
  amount: z.number().int().positive('Amount must be positive'),
  purpose: z.string().min(3, 'Purpose must be at least 3 characters').trim(),
  fileId: z.string().optional(), // Optional link to a specific file
});

export type MoneyRequestInput = z.infer<typeof MoneyRequestSchema>;

export const ExpenseSchema = z.object({
  amount: z.number().int().positive('Amount must be positive'),
  category: ExpenseCategorySchema,
  description: z.string().min(3, 'Description must be at least 3 characters').trim(),
  fileId: z.string().min(1, 'File ID is required for expenses'),
  receiptUrl: z.string().url('Invalid receipt URL').optional(),
});

export type ExpenseInput = z.infer<typeof ExpenseSchema>;
