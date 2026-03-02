import { Request, Response } from 'express';
import * as financeService from './finance.service';
import * as categoryController from './expense-category.controller';
import {
  MoneyRequestSchema,
  ExpenseSchema
} from '@repo/shared';

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// POST /api/finance/requests (Staff requests money)
export const requestMoney = asyncHandler(async (req: Request, res: Response) => {
  const data = MoneyRequestSchema.parse(req.body);
  const result = await financeService.createRequest(req.tenantId!, req.user!.id, data);
  res.status(201).json({ success: true, data: result });
});

// GET /api/finance/my-wallet (Staff views their own financials)
export const getMyFinancials = asyncHandler(async (req: Request, res: Response) => {
  const result = await financeService.listStaffFinancials(req.tenantId!, req.user!.id);
  res.status(200).json({ success: true, data: result });
});

// POST /api/finance/settle (Staff settles an expense)
export const settleExpense = asyncHandler(async (req: Request, res: Response) => {
  const data = ExpenseSchema.parse(req.body);
  const requestId = req.body.requestId; // Optional link to a specific request
  const result = await financeService.settleExpense(req.tenantId!, req.user!.id, { ...data, requestId });
  res.status(201).json({ success: true, data: result });
});

// ── Manager/Owner Endpoints ──────────────────────────────

// GET /api/finance/requests (List all requests in store)
export const listAllRequests = asyncHandler(async (req: Request, res: Response) => {
  const { status, isArchived } = req.query;
  const filters: any = {};
  if (status) filters.status = status;
  if (isArchived !== undefined) filters.isArchived = isArchived;

  const result = await financeService.listStoreRequests(req.tenantId!, filters);
  res.status(200).json({ success: true, data: result });
});

// GET /api/finance/expenses (List all direct expenses in store)
export const listAllExpenses = asyncHandler(async (req: Request, res: Response) => {
  const result = await financeService.listAllExpenses(req.tenantId!);
  res.status(200).json({ success: true, data: result });
});

// PUT /api/finance/requests/:requestId/approve
export const approveRequest = asyncHandler(async (req: Request, res: Response) => {
  const { requestId } = req.params;
  const grantedAmount = req.body?.grantedAmount !== undefined ? Number(req.body.grantedAmount) : undefined;
  const result = await financeService.approveRequest(req.tenantId!, requestId, req.user!.id, grantedAmount);
  res.status(200).json({ success: true, data: result });
});

// PUT /api/finance/requests/:requestId/reject
export const rejectRequest = asyncHandler(async (req: Request, res: Response) => {
  const { requestId } = req.params;
  const result = await financeService.rejectRequest(req.tenantId!, requestId);
  res.status(200).json({ success: true, data: result });
});

// PUT /api/finance/requests/:requestId/archive
export const archiveRequest = asyncHandler(async (req: Request, res: Response) => {
  const { requestId } = req.params;
  const result = await financeService.archiveRequest(req.tenantId!, requestId);
  res.status(200).json({ success: true, data: result });
});

// PUT /api/finance/requests/:requestId/unarchive
export const unarchiveRequest = asyncHandler(async (req: Request, res: Response) => {
  const { requestId } = req.params;
  const result = await financeService.unarchiveRequest(req.tenantId!, requestId);
  res.status(200).json({ success: true, data: result });
});

// GET /api/finance/staff/:staffId (View a specific staff's financials)
export const getStaffFinancials = asyncHandler(async (req: Request, res: Response) => {
  const { staffId } = req.params;
  const result = await financeService.listStaffFinancials(req.tenantId!, staffId);
  res.status(200).json({ success: true, data: result });
});

// GET /api/finance/files/:fileId (View expenses for a specific file)
export const getFileExpenses = asyncHandler(async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const result = await financeService.listFileExpenses(req.tenantId!, fileId);
  res.status(200).json({ success: true, data: result });
});

// GET /api/finance/dashboard (Dashboard stats)
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const result = await financeService.getDashboardStats(req.tenantId!);
  res.status(200).json({ success: true, data: result });
});

// ── Expense Categories (Proxied to category controller) ──
export const listCategories = categoryController.listCategories;
export const createCategory = categoryController.createCategory;
export const updateCategory = categoryController.updateCategory;
