import { InvoiceModel } from './report.model';
import { ReportTemplateModel } from './report-template.model';
import { FileModel } from '../file/file.model';
import { InvoiceInput, InvoiceType, ReportTemplateInput } from '@repo/shared';
import { Types } from 'mongoose';

export const reportService = {
  async getFilesForReport(tenantId: string) {
    // Get all files for this tenant
    const files = await FileModel.find({ tenantId, isDeleted: false })
      .populate('clientId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Get all invoices for these files
    const fileIds = files.map(f => f._id);
    const invoices = await InvoiceModel.find({
      tenantId,
      fileId: { $in: fileIds }
    }).lean();

    // Attach invoice status to files
    return files.map((file: any) => {
      const pda = invoices.find(inv => inv.fileId.toString() === file._id.toString() && inv.type === 'PDA');
      const fda = invoices.find(inv => inv.fileId.toString() === file._id.toString() && inv.type === 'FDA');

      return {
        ...file,
        hasInitial: !!pda,
        hasFinal: !!fda,
        initialId: pda?._id,
        finalId: fda?._id
      };
    });
  },

  async getInvoice(tenantId: string, fileId: string, type: InvoiceType) {
    return InvoiceModel.findOne({ tenantId, fileId, type }).lean();
  },

  async upsertInvoice(tenantId: string, data: InvoiceInput) {
    const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0);

    return InvoiceModel.findOneAndUpdate(
      { tenantId, fileId: data.fileId, type: data.type },
      { ...data, totalAmount },
      { upsert: true, new: true, runValidators: true }
    ).lean();
  },

  async getTemplate(tenantId: string, type: InvoiceType) {
    return ReportTemplateModel.findOne({ tenantId, type }).lean();
  },

  async upsertTemplate(tenantId: string, data: ReportTemplateInput) {
    return ReportTemplateModel.findOneAndUpdate(
      { tenantId, type: data.type },
      { items: data.items },
      { upsert: true, new: true, runValidators: true }
    ).lean();
  }
};
