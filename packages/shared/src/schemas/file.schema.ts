import { z } from 'zod';

export const FileStatusEnum = z.enum([
  'CREATED',
  'IGM_RECEIVED',
  'BE_FILED',
  'UNDER_ASSESSMENT',
  'ASSESSMENT_COMPLETE',
  'DUTY_PAID',
  'DELIVERED',
  'BILLED',
  'ARCHIVED',
]);

export const CreateFileSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  blNo: z.string().trim().min(1, 'B/L Number is required'),
  blDate: z.string().min(1, 'B/L Date is required'),

  // Financial info (stored as Taka)
  invoiceValue: z.number().min(0, 'Invoice value must be positive').optional().default(0),
  currency: z.string().default('USD'),
  hsCode: z.string().trim().optional(),
  description: z.string().trim().optional(),

  quantity: z.number().min(0).optional(),
  weight: z.number().min(0).optional(),

  // Shipping info
  vesselName: z.string().trim().optional(),
  voyageNo: z.string().trim().optional(),
  rotationNo: z.string().trim().optional(),
  igmNo: z.string().trim().optional(),
  igmDate: z.string().optional(),
  arrivalDate: z.string().optional(),
});

export type FileStatus = z.infer<typeof FileStatusEnum>;
export type CreateFileInput = z.infer<typeof CreateFileSchema>;

export const UpdateFileSchema = CreateFileSchema.partial().extend({
  status: FileStatusEnum.optional(),
});
export type UpdateFileInput = z.infer<typeof UpdateFileSchema>;
