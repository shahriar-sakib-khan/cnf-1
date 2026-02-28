import { FileModel, IFile } from './file.model';
import { CreateFileInput, UpdateFileInput } from '@repo/shared';
import { Types } from 'mongoose';

/**
 * Generate next file number for a tenant
 * Starts from 1001
 */
async function getNextFileNo(tenantId: string): Promise<number> {
  const lastFile = await FileModel.findOne({ tenantId })
    .sort({ fileNo: -1 })
    .select('fileNo')
    .lean();

  return lastFile ? lastFile.fileNo + 1 : 1001;
}

export const createFile = async (tenantId: string, userId: string, data: CreateFileInput): Promise<IFile> => {
  const fileNo = await getNextFileNo(tenantId);
  const fileNoFull = `IMP-EXP-${fileNo}`;

  const file = await FileModel.create({
    ...data,
    tenantId,
    createdBy: userId,
    fileNo,
    fileNoFull,
    status: 'CREATED'
  });

  return file;
};

export const listFiles = async (tenantId: string, query: {
  page?: number,
  limit?: number,
  status?: string,
  search?: string
}) => {
  const { page = 1, limit = 20, status, search } = query;
  const skip = (page - 1) * limit;

  const filter: any = { tenantId, isDeleted: false };
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { fileNoFull: { $regex: search, $options: 'i' } },
      { blNo: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const [files, total] = await Promise.all([
    FileModel.find(filter)
      .populate('clientId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    FileModel.countDocuments(filter)
  ]);

  return {
    files,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getFile = async (tenantId: string, fileId: string): Promise<any> => {
  return FileModel.findOne({ _id: fileId, tenantId, isDeleted: false })
    .populate('clientId')
    .lean();
};

export const updateFile = async (tenantId: string, fileId: string, data: UpdateFileInput): Promise<any> => {
  return FileModel.findOneAndUpdate(
    { _id: fileId, tenantId },
    { $set: data },
    { new: true, runValidators: true }
  ).lean();
};


export const deleteFile = async (tenantId: string, fileId: string): Promise<boolean> => {
  const result = await FileModel.updateOne(
    { _id: fileId, tenantId },
    { $set: { isDeleted: true, deletedAt: new Date() } }
  );
  return result.modifiedCount > 0;
};
