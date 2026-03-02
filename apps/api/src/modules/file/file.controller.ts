import { Request, Response } from 'express';
import * as fileService from './file.service';
import { CreateFileSchema, UpdateFileSchema, AssessmentUpdateSchema } from '@repo/shared';

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = CreateFileSchema.parse(req.body);
  const result = await fileService.createFile(req.tenantId!, req.user!.id, data);
  res.status(201).json({ success: true, data: result });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, status, search, clientId } = req.query;
  const result = await fileService.listFiles(req.tenantId!, {
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 20,
    status: status as string,
    search: search as string,
    clientId: clientId as string
  });
  res.status(200).json({ success: true, ...result });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const result = await fileService.getFile(req.tenantId!, req.params.id);
  if (!result) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'File not found' }
    });
  }
  res.status(200).json({ success: true, data: result });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = UpdateFileSchema.parse(req.body);
  const result = await fileService.updateFile(req.tenantId!, req.user!.id, req.params.id, data);
  if (!result) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'File not found' }
    });
  }
  res.status(200).json({ success: true, data: result });
});

export const addDoc = asyncHandler(async (req: Request, res: Response) => {
  const result = await fileService.addFileDocument(req.tenantId!, req.user!.id, req.params.id, req.body);
  res.status(201).json({ success: true, data: result });
});

export const removeDoc = asyncHandler(async (req: Request, res: Response) => {
  await fileService.deleteFileDocument(req.tenantId!, req.params.id, req.params.docId);
  res.status(200).json({ success: true, data: { message: 'Document removed' } });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const success = await fileService.deleteFile(req.tenantId!, req.params.id);
  if (!success) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'File not found' }
    });
  }
  res.status(200).json({ success: true, data: { message: 'File deleted' } });
});

export const downloadDocs = asyncHandler(async (req: Request, res: Response) => {
  const { buffer, fileName } = await fileService.downloadDocuments(req.tenantId!, req.params.id);
  res.set('Content-Type', 'application/zip');
  res.set('Content-Disposition', `attachment; filename=${fileName}`);
  res.send(buffer);
});

export const updateDocStatus = asyncHandler(async (req: Request, res: Response) => {
  const result = await fileService.updateDocStatus(req.tenantId!, req.params.id, req.body);
  res.status(200).json({ success: true, data: result });
});

export const updateAssessment = asyncHandler(async (req: Request, res: Response) => {
  const { node, status, notes } = AssessmentUpdateSchema.parse(req.body);
  const result = await fileService.updateAssessmentNode(
    req.tenantId!, 
    req.user!.id, 
    req.params.id, 
    node, 
    status, 
    notes
  );
  res.status(200).json({ success: true, data: result });
});

export const transferAssessment = asyncHandler(async (req: Request, res: Response) => {
  const result = await fileService.transferAssessmentNode(
    req.tenantId!,
    req.user!.id,
    req.params.id,
    req.body.node
  );
  res.status(200).json({ success: true, data: result });
});

export const resetAssessment = asyncHandler(async (req: Request, res: Response) => {
  const result = await fileService.resetAssessmentNode(
    req.tenantId!,
    req.user!.id,
    req.params.id
  );
  res.status(200).json({ success: true, data: result });
});
