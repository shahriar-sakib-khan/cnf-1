import mongoose from 'mongoose';
import { ClientModel } from './client.model';
import { CreateClientInput, UpdateClientInput } from '@repo/shared';

export const createClient = async (tenantId: string, data: CreateClientInput) => {
  // Check for existing active client with same name in tenant
  const existing = await ClientModel.findOne({ tenantId, name: data.name, isDeleted: false }).lean();
  if (existing) {
    throw new Error('Client with this name already exists');
  }

  const client = await ClientModel.create({
    tenantId,
    ...data,
  });
  return client.toJSON();
};

export const getClients = async (tenantId: string, page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;
  const query = { tenantId, isDeleted: false };
  const { FileModel } = await import('../file/file.model');
  const { ExpenseModel } = await import('../finance/finance.model');

  const [clients, total] = await Promise.all([
    ClientModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ClientModel.countDocuments(query)
  ]);

  // Enrich with fileCount and totalExpenseAllFiles
  const data = await Promise.all(clients.map(async (client) => {
    const files = await FileModel.find({
      tenantId,
      clientId: client._id,
      isDeleted: false
    }).select('_id').lean();

    const fileIds = files.map(f => f._id);
    const expenses = await ExpenseModel.aggregate([
      { $match: { fileId: { $in: fileIds } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return {
      ...client,
      fileCount: files.length,
      totalExpenseAllFiles: expenses[0]?.total || 0
    };
  }));

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
};

export const getClientById = async (tenantId: string, id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid Client ID');
  const client = await ClientModel.findOne({ _id: id, tenantId, isDeleted: false }).lean();
  if (!client) throw new Error('Client not found');
  return client;
};

export const updateClient = async (tenantId: string, id: string, data: UpdateClientInput) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid Client ID');
  const client = await ClientModel.findOneAndUpdate(
    { _id: id, tenantId, isDeleted: false },
    { $set: data },
    { new: true }
  ).lean();

  if (!client) throw new Error('Client not found');
  return client;
};

export const deleteClient = async (tenantId: string, id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid Client ID');
  const client = await ClientModel.findOneAndUpdate(
    { _id: id, tenantId, isDeleted: false },
    { $set: { isDeleted: true, deletedAt: new Date() } },
    { new: true }
  ).lean();

  if (!client) throw new Error('Client not found');
  return { message: 'Client soft deleted successfully' };
};

export const getClientStats = async (tenantId: string) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, newThisMonth] = await Promise.all([
    ClientModel.countDocuments({ tenantId, isDeleted: false }),
    ClientModel.countDocuments({ tenantId, isDeleted: false, createdAt: { $gte: startOfMonth } })
  ]);

  return { total, newThisMonth };
};

/**
 * Fetch files for a client with total expenses per file
 */
export const getClientFiles = async (tenantId: string, clientId: string) => {
  const { FileModel } = await import('../file/file.model');
  const { ExpenseModel } = await import('../finance/finance.model');

  const files = await FileModel.find({
    tenantId,
    clientId,
    isDeleted: false
  }).sort({ createdAt: -1 }).lean();

  const filesWithExpenses = await Promise.all(
    files.map(async (file) => {
      const expenses = await ExpenseModel.aggregate([
        {
          $match: {
            fileId: file._id,
            tenantId: new mongoose.Types.ObjectId(tenantId)
          }
        },
        { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
      ]);

      return {
        ...file,
        totalExpense: expenses[0]?.totalAmount || 0
      };
    })
  );

  const totalExpenseAllFiles = filesWithExpenses.reduce((acc, f) => acc + (f.totalExpense || 0), 0);

  return {
    files: filesWithExpenses,
    stats: {
      totalFiles: files.length,
      totalExpenseAllFiles,
      activeFiles: files.filter(f => !['DELIVERED', 'BILLED', 'ARCHIVED'].includes(f.status)).length
    }
  };
};
