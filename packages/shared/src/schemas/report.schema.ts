import { z } from 'zod';

export const InvoiceTypeEnum = z.enum(['PDA', 'FDA']);
export type InvoiceType = z.infer<typeof InvoiceTypeEnum>;

export const InvoiceItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'Description is required').trim(),
  amount: z.number().int().min(0, 'Amount must be non-negative'), // Paisa/Taka integer
  isPermanent: z.boolean().default(false).optional(),
  subDescriptions: z.array(z.string()).optional(),
  subWidths: z.array(z.number()).optional(),
});

export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;

export const InvoiceDetailsSchema = z.object({
  refNo: z.string().trim().optional(),
  date: z.string().trim().optional(),
  vesselName: z.string().trim().optional(),
  voyage: z.string().trim().optional(),
  eta: z.string().trim().optional(),
  grt: z.string().trim().optional(),
  nrt: z.string().trim().optional(),
  cargo: z.string().trim().optional(),
  berthing: z.string().trim().optional(),
  departure: z.string().trim().optional(),
  quantity: z.string().trim().optional(),
  bankingDetails: z.string().trim().optional(),
  additionalFields: z.array(z.object({
    label: z.string().trim(),
    value: z.string().trim(),
  })).optional(),
});

export type InvoiceDetails = z.infer<typeof InvoiceDetailsSchema>;

export const InvoiceSchema = z.object({
  fileId: z.string().min(1, 'File is required'),
  type: InvoiceTypeEnum,
  details: InvoiceDetailsSchema.optional(),
  items: z.array(InvoiceItemSchema).min(1, 'At least one item is required'),
  notes: z.string().trim().optional(),
  isPaid: z.boolean().default(false),
});

export type InvoiceInput = z.infer<typeof InvoiceSchema>;
export type Invoice = InvoiceInput & { _id: string; tenantId: string; totalAmount: number; createdAt: string; updatedAt: string };

export const ReportTemplateItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'Description is required').trim(),
  subDescriptions: z.array(z.string()).optional(),
  subWidths: z.array(z.number()).optional(),
});

export const ReportTemplateSchema = z.object({
  type: InvoiceTypeEnum,
  items: z.array(ReportTemplateItemSchema).min(1, 'At least one item is required'),
});

export type ReportTemplateInput = z.infer<typeof ReportTemplateSchema>;
export type ReportTemplate = ReportTemplateInput & { _id: string; tenantId: string; createdAt: string; updatedAt: string };
