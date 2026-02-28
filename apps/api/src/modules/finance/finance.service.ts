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
export const approveRequest = async (tenantId: string, requestId: string, managerId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const request = await MoneyRequestModel.findOne({ _id: requestId, tenantId, status: 'PENDING' }).session(session);
    if (!request) throw new Error('Request not found or already processed');

    // 1. Update Staff Balance
    await UserModel.findByIdAndUpdate(
      request.staffId,
      { $inc: { balanceTaka: request.amount } },
      { session }
    );

    // 2. Create Immutable Ledger Event
    await LedgerEventModel.create([{
      tenantId,
      type: 'CREDIT',
      amount: request.amount,
      fromId: managerId, // Representing the store/manager context
      toId: request.staffId,
      refId: request._id,
      refType: 'MoneyRequest',
      description: `Approved request: ${request.purpose}`,
    }], { session });

    // 3. Update Request Status
    request.status = 'APPROVED';
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
    if (!staff || staff.balanceTaka < data.amount) {
      throw new Error('Insufficient wallet balance');
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

// ── Queries & Analytics ──────────────────────────────────

export const listStoreRequests = async (tenantId: string, filters: any = {}) => {
  return MoneyRequestModel.find({ tenantId, ...filters })
    .populate('staffId', 'name email phone')
    .sort({ createdAt: -1 })
    .lean();
};

export const listStaffFinancials = async (tenantId: string, staffId: string) => {
  const [requests, expenses, user] = await Promise.all([
    MoneyRequestModel.find({ tenantId, staffId }).sort({ createdAt: -1 }).limit(50).lean(),
    ExpenseModel.find({ tenantId, staffId }).sort({ createdAt: -1 }).limit(50).lean(),
    UserModel.findById(staffId).select('balanceTaka').lean(),
  ]);

  return {
    balance: user?.balanceTaka || 0,
    requests,
    expenses,
  };
};

export const listFileExpenses = async (tenantId: string, fileId: string) => {
  return ExpenseModel.find({ tenantId, fileId })
    .populate('staffId', 'name')
    .sort({ createdAt: -1 })
    .lean();
};
