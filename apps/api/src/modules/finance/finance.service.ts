import mongoose from 'mongoose';
import {
  MoneyRequestModel,
  ExpenseModel,
  LedgerEventModel
} from './finance.model';
import { UserModel } from '../auth/user.model';
import {
  MoneyRequestInput,
  ExpenseInput
} from '@repo/shared';

// ── Money Requests ───────────────────────────────────────

export const createRequest = async (tenantId: string, staffId: string, data: MoneyRequestInput) => {
  return MoneyRequestModel.create({
    tenantId,
    staffId,
    ...data,
    status: 'PENDING',
  });
};

/**
 * Approve Request: Store -> Staff Wallet
 * Must be ACID compliant using Sessions and Transactions.
 */
export const approveRequest = async (
  tenantId: string,
  requestId: string,
  managerId: string,
  grantedAmount?: number
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const request = await MoneyRequestModel.findOne({ _id: requestId, tenantId, status: 'PENDING' }).session(session);
    if (!request) throw new Error('Request not found or already processed');

    // Use grantedAmount if provided; fall back to requested amount
    const creditAmount = (grantedAmount !== undefined && grantedAmount >= 0) ? grantedAmount : request.amount;

    // 1. Update Staff Balance with actual granted amount
    await UserModel.findByIdAndUpdate(
      request.staffId,
      { $inc: { balanceTaka: creditAmount } },
      { session }
    );

    // 2. Create Immutable Ledger Event
    await LedgerEventModel.create([{
      tenantId,
      type: 'CREDIT',
      amount: creditAmount,
      fromId: managerId,
      toId: request.staffId,
      refId: request._id,
      refType: 'MoneyRequest',
      description: `Approved request: ${request.purpose}${creditAmount !== request.amount ? ` (requested: ${request.amount}, granted: ${creditAmount})` : ''}`,
    }], { session });

    // 3. Update Request Status with granted amount
    request.status = 'APPROVED';
    request.grantedAmount = creditAmount;
    request.approvedBy = new mongoose.Types.ObjectId(managerId);
    request.approvedAt = new Date();
    await request.save({ session });

    await session.commitTransaction();
    return request;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

/**
 * Settle Expense: Staff Wallet -> Expense Record
 */
export const settleExpense = async (tenantId: string, staffId: string, data: ExpenseInput & { requestId?: string }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const staff = await UserModel.findOne({ _id: staffId, tenantId }).session(session);
    if (!staff) {
      throw new Error('Staff not found');
    }

    // 1. Deduct from Staff Balance
    await UserModel.findByIdAndUpdate(
      staffId,
      { $inc: { balanceTaka: -data.amount } },
      { session }
    );

    // 2. Create Expense Record
    const expense = await ExpenseModel.create([{
      tenantId,
      staffId,
      ...data,
    }], { session });

    // 3. Create Ledger Event
    await LedgerEventModel.create([{
      tenantId,
      type: 'DEBIT',
      amount: data.amount,
      fromId: staffId,
      refId: expense[0]._id,
      refType: 'Expense',
      description: `Settled expense: ${data.description}`,
    }], { session });

    // 4. Update Money Request Status if linked
    if (data.requestId) {
      await MoneyRequestModel.findByIdAndUpdate(
        data.requestId,
        { status: 'SETTLED' },
        { session }
      );
    }

    await session.commitTransaction();
    return expense[0];
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const rejectRequest = async (tenantId: string, requestId: string) => {
  return MoneyRequestModel.findOneAndUpdate(
    { _id: requestId, tenantId, status: 'PENDING' },
    { status: 'REJECTED' },
    { new: true }
  );
};

export const archiveRequest = async (tenantId: string, requestId: string) => {
  const request = await MoneyRequestModel.findOne({ _id: requestId, tenantId }).populate('fileId');
  if (!request) throw new Error('Request not found');

  if (request.status === 'PENDING') {
    throw new Error('Cannot archive pending requests');
  }

  if (request.fileId) {
    const file = request.fileId as any;
    const CLEARED_STATUSES = ['DELIVERED', 'BILLED', 'ARCHIVED'];
    if (!CLEARED_STATUSES.includes(file.status)) {
      throw new Error('Cannot archive request before file is cleared');
    }
  }

  request.isArchived = true;
  await request.save();
  return request;
};

export const unarchiveRequest = async (tenantId: string, requestId: string) => {
  const request = await MoneyRequestModel.findOne({ _id: requestId, tenantId });
  if (!request) {
    throw new Error('Request not found');
  }

  request.isArchived = false;
  await request.save();
  return request;
};

// ── Queries & Analytics ──────────────────────────────────

export const listStoreRequests = async (tenantId: string, filters: any = {}) => {
  // Default to isArchived: false unless explicitly filtering for it
  const isArchived = filters.isArchived === 'true' || filters.isArchived === true;
  const match: any = { tenantId, isArchived };
  if (filters.status) match.status = filters.status;

  return MoneyRequestModel.find(match)
    .populate('staffId', 'name email phone balanceTaka role')
    .populate('approvedBy', 'name role')
    .populate({
      path: 'fileId',
      select: 'fileNoFull status clientId',
      populate: { path: 'clientId', select: 'name' }
    })
    .sort({ createdAt: -1 })
    .lean();
};

export const listStaffFinancials = async (tenantId: string, staffId: string) => {
  const tId = new mongoose.Types.ObjectId(tenantId);
  const sId = new mongoose.Types.ObjectId(staffId);

  const [requests, expenses, user] = await Promise.all([
    MoneyRequestModel.find({ tenantId: tId, staffId: sId })
      .populate('staffId', 'name email phone balanceTaka role')
      .populate('approvedBy', 'name role')
      .populate({
        path: 'fileId',
        select: 'fileNoFull status clientId',
        populate: { path: 'clientId', select: 'name' }
      })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
    ExpenseModel.find({ tenantId: tId, staffId: sId })
      .populate('fileId', 'fileNoFull')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
    UserModel.findById(sId).select('balanceTaka').lean(),
  ]);

  return {
    balance: (user as any)?.balanceTaka || 0,
    requests,
    expenses,
  };
};

export const listFileExpenses = async (tenantId: string, fileId: string) => {
  return ExpenseModel.find({ tenantId, fileId })
    .populate('staffId', 'name balanceTaka')
    .populate('category', 'name')
    .sort({ createdAt: -1 })
    .lean();
};

export const listAllExpenses = async (tenantId: string) => {
  return ExpenseModel.find({ tenantId })
    .populate('staffId', 'name email role balanceTaka')
    .populate('category', 'name')
    .populate({
      path: 'fileId',
      select: 'fileNoFull clientId status',
      populate: { path: 'clientId', select: 'name' }
    })
    .sort({ createdAt: -1 })
    .lean();
};

// ── Dashboard Stats ──────────────────────────────────────

import { FileModel } from '../file/file.model';

export const getDashboardStats = async (tenantId: string) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const ACTIVE_STATUSES = ['CREATED', 'IGM_RECEIVED', 'BE_FILED', 'UNDER_ASSESSMENT', 'ASSESSMENT_COMPLETE', 'DUTY_PAID'];
  const CLEARED_STATUSES = ['DELIVERED', 'BILLED', 'ARCHIVED'];

  const [
    filesActive,
    filesCleared,
    filesTotal,
    pendingRequests,
    approvedThisMonth,
  ] = await Promise.all([
    FileModel.countDocuments({ tenantId, isDeleted: { $ne: true }, status: { $in: ACTIVE_STATUSES } }),
    FileModel.countDocuments({ tenantId, isDeleted: { $ne: true }, status: { $in: CLEARED_STATUSES } }),
    FileModel.countDocuments({ tenantId, isDeleted: { $ne: true } }),
    MoneyRequestModel.countDocuments({ tenantId, status: 'PENDING' }),
    MoneyRequestModel.aggregate([
      {
        $match: {
          tenantId: new mongoose.Types.ObjectId(tenantId),
          status: 'APPROVED',
          approvedAt: { $gte: startOfMonth },
        }
      },
      { $group: { _id: null, total: { $sum: '$grantedAmount' } } }
    ]),
  ]);

  // Recent requests (last 10)
  const recentRequests = await MoneyRequestModel.find({ tenantId })
    .populate('staffId', 'name')
    .sort({ status: -1, createdAt: -1 }) // PENDING comes before APPROVED alphabetically
    .limit(10)
    .lean();

  return {
    filesActive,
    filesCleared,
    filesTotal,
    pendingRequests,
    approvedThisMonthTaka: approvedThisMonth[0]?.total || 0,
    recentRequests,
  };
};
