import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportService } from './report.service';
import { InvoiceModel } from './report.model';
import { ReportTemplateModel } from './report-template.model';
import { FileModel } from '../file/file.model';

vi.mock('./report.model');
vi.mock('./report-template.model');
vi.mock('../file/file.model');

describe('Report Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Report Templates (PDA/FDA)', () => {
    it('should upsert a new report template', async () => {
      const mockResult = { _id: '123', type: 'PDA', items: [{ id: '1', description: 'PORT DUES' }] };
      (ReportTemplateModel.findOneAndUpdate as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockResult)
      });

      const result = await reportService.upsertTemplate('tenant-1', {
        type: 'PDA',
        items: [{ id: '1', description: 'PORT DUES' }]
      });

      expect(result).toEqual(mockResult);
      expect(ReportTemplateModel.findOneAndUpdate).toHaveBeenCalledWith(
        { tenantId: 'tenant-1', type: 'PDA' },
        { items: [{ id: '1', description: 'PORT DUES' }] },
        expect.objectContaining({ upsert: true, new: true })
      );
    });

    it('should retrieve a template by type', async () => {
      const mockResult = { _id: '123', type: 'FDA', items: [{ id: '2', description: 'AGENCY FEE' }] };
      (ReportTemplateModel.findOne as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockResult)
      });

      const result = await reportService.getTemplate('tenant-1', 'FDA');

      expect(result).toEqual(mockResult);
      expect(ReportTemplateModel.findOne).toHaveBeenCalledWith({ tenantId: 'tenant-1', type: 'FDA' });
    });
  });

  describe('Report Invoicing', () => {
    it('should get files mapped with their PDA/FDA statuses', async () => {
      const mockFiles = [
        { _id: 'file-1', fileNoFull: 'IMP-001' },
      ];
      const mockInvoices = [
        { _id: 'inv-1', fileId: 'file-1', type: 'PDA' },
        { _id: 'inv-2', fileId: 'file-1', type: 'FDA' }
      ];

      const moqFindFile = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockFiles)
      };

      (FileModel.find as any).mockReturnValue(moqFindFile);
      (InvoiceModel.find as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockInvoices)
      });

      const result = await reportService.getFilesForReport('tenant-1');

      expect(result.length).toBe(1);
      expect(result[0].hasInitial).toBe(true);
      expect(result[0].hasFinal).toBe(true);
      expect(result[0].initialId).toBe('inv-1');
      expect(result[0].finalId).toBe('inv-2');
    });

    it('should calculate the totalAmount accurately on upsertInvoice', async () => {
      const inputData = {
        fileId: 'file-1',
        type: 'PDA' as const,
        items: [{ id: '1', description: 'FEE 1', amount: 100 }, { id: '2', description: 'FEE 2', amount: 50 }],
        isPaid: false
      };

      const expectedTotal = 150;

      (InvoiceModel.findOneAndUpdate as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue({ ...inputData, totalAmount: expectedTotal })
      });

      const result = (await reportService.upsertInvoice('tenant-1', inputData)) as any;

      expect(result.totalAmount).toBe(expectedTotal);
      expect(InvoiceModel.findOneAndUpdate).toHaveBeenCalledWith(
        { tenantId: 'tenant-1', fileId: 'file-1', type: 'PDA' },
        expect.objectContaining({ totalAmount: expectedTotal }),
        expect.any(Object)
      );
    });
  });
});
