import { z } from 'zod';

export const ClientTypeEnum = z.enum(['IMPORTER', 'EXPORTER', 'BOTH']);

export const CreateClientSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  phone: z.string().trim().optional(),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().trim().optional(),
  type: ClientTypeEnum,
});

export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type ClientType = z.infer<typeof ClientTypeEnum>;

export const UpdateClientSchema = CreateClientSchema.partial().omit({}); // Allow partial updates
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;
