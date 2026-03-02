import { z } from 'zod';

export const RequestStatusSchema = z.enum(['PENDING', 'APPROVED', 'SETTLED', 'REJECTED']);
export type RequestStatus = z.infer<typeof RequestStatusSchema>;

export const ExpenseCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  isActive: z.boolean().default(true),
});

export type ExpenseCategoryInput = z.infer<typeof ExpenseCategorySchema>;

export const MoneyRequestSchema = z.object({
  amount: z.number().int().positive('Amount must be positive'),
  purpose: z.string().trim().optional(),
  fileId: z.string().optional(), // Optional link to a specific file
});

export type MoneyRequestInput = z.infer<typeof MoneyRequestSchema>;

export const ExpenseSchema = z.object({
  amount: z.number().int().positive('Amount must be positive'),
  category: z.string().min(1, 'Category is required'), // Now an ObjectId string
  description: z.string().trim().optional(),
  fileId: z.string().optional(),
  receiptUrl: z.string().url('Invalid receipt URL').optional(),
});

export type ExpenseInput = z.infer<typeof ExpenseSchema>;
