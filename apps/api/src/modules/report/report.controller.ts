import { Request, Response } from 'express';
import { reportService } from './report.service';
import { InvoiceSchema, ReportTemplateSchema } from '@repo/shared';

export const reportController = {
  async getFilesForReport(req: Request, res: Response) {
    const data = await reportService.getFilesForReport(req.tenantId as string);
    res.json({ success: true, data });
  },

  async getInvoice(req: Request, res: Response) {
    const { fileId, type } = req.params;
    const data = await reportService.getInvoice(req.tenantId as string, fileId, type as any);
    res.json({ success: true, data });
  },

  async upsertInvoice(req: Request, res: Response) {
    const validated = InvoiceSchema.parse(req.body);
    const data = await reportService.upsertInvoice(req.tenantId as string, validated);
    res.json({ success: true, data });
  },

  async getTemplate(req: Request, res: Response) {
    const { type } = req.params;
    const data = await reportService.getTemplate(req.tenantId as string, type as any);
    res.json({ success: true, data });
  },

  async upsertTemplate(req: Request, res: Response) {
    const validated = ReportTemplateSchema.parse(req.body);
    const data = await reportService.upsertTemplate(req.tenantId as string, validated);
    res.json({ success: true, data });
  }
};
