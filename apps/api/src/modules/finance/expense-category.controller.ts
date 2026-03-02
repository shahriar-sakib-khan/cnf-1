import { Request, Response } from 'express';
import { ExpenseCategoryModel } from './expense-category.model';
import { ExpenseCategorySchema } from '@repo/shared';

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// GET /api/finance/categories
export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await ExpenseCategoryModel.find({
    tenantId: req.tenantId,
    isActive: true
  }).sort({ name: 1 }).lean();

  res.status(200).json({ success: true, data: categories });
});

// POST /api/finance/categories (Admin only)
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const data = ExpenseCategorySchema.parse(req.body);

  const category = await ExpenseCategoryModel.create({
    ...data,
    tenantId: req.tenantId
  });

  res.status(201).json({ success: true, data: category });
});

// PUT /api/finance/categories/:id (Admin only)
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = ExpenseCategorySchema.partial().parse(req.body);

  const category = await ExpenseCategoryModel.findOneAndUpdate(
    { _id: id, tenantId: req.tenantId },
    { $set: data },
    { new: true }
  ).lean();

  if (!category) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } });
  }

  res.status(200).json({ success: true, data: category });
});
