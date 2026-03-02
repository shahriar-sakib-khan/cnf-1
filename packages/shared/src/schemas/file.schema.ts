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

export const FileDocumentCategoryEnum = z.enum(['COPY', 'ORIGINAL']);

export const AssessmentNodeEnum = z.enum([
  'ARO', 'RO', 'AC', 'DC',
  'JC1', 'JC2', 'JC3',
  'ADC1', 'ADC2', 'COMMISSIONER'
]);

export const CustomsLaneEnum = z.enum(['GREEN', 'YELLOW', 'RED']);

export const ContainerTypeEnum = z.enum(['FCL', 'LCL']);

export const PackageTypeEnum = z.enum([
  'PACKAGE', 'PX', 'ROLL', 'BALE', 'CASE', 'CARTON', 'DRUM', 'BAG', 'OTHER'
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

  // CNF Specific
  exporterName: z.string().trim().optional(),
  copyDocsReceived: z.boolean().optional().default(false),
  originalDocsReceived: z.boolean().optional().default(false),

  // Customs info
  boeNumber: z.string().trim().optional(),
  beDate: z.string().optional(),
  cNumber: z.string().trim().optional(),
  cDate: z.string().optional(),
  assessmentValue: z.number().min(0).optional(),
  customsLane: CustomsLaneEnum.optional(),

  // Financial Docs
  lcNumber: z.string().trim().optional(),
  lcDate: z.string().optional(),
  piNumber: z.string().trim().optional(),

  // Cargo Details
  countryOfOrigin: z.string().trim().optional(),
  containerType: ContainerTypeEnum.optional(),
  packageType: PackageTypeEnum.optional(),

  // Logistics
  deliveryOrderStatus: z.boolean().optional().default(false),
  portBillPaid: z.boolean().optional().default(false),
  gatePassNo: z.string().trim().optional(),
  exitDate: z.string().optional(),

  // Container Info
  containerNumbers: z.string().trim().optional(),
  
  // Shipping info
  vesselName: z.string().trim().optional(),
  voyageNo: z.string().trim().optional(),
  rotationNo: z.string().trim().optional(),
  igmNo: z.string().trim().optional(),
  igmDate: z.string().optional(),
  arrivalDate: z.string().optional(),
});

export type FileStatus = z.infer<typeof FileStatusEnum>;
export type FileDocumentCategory = z.infer<typeof FileDocumentCategoryEnum>;
export type CreateFileInput = z.infer<typeof CreateFileSchema>;

export const UpdateFileSchema = CreateFileSchema.partial().extend({
  status: FileStatusEnum.optional(),
  statusNotes: z.string().optional(),
});
export type UpdateFileInput = z.infer<typeof UpdateFileSchema>;

export const AssessmentUpdateSchema = z.object({
  node: AssessmentNodeEnum,
  status: z.enum(['PENDING', 'ACTIVE', 'COMPLETED', 'SKIPPED']),
  notes: z.string().optional(),
});
export type AssessmentUpdateInput = z.infer<typeof AssessmentUpdateSchema>;
