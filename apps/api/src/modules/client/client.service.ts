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

  const [data, total] = await Promise.all([
    ClientModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ClientModel.countDocuments(query)
  ]);

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
