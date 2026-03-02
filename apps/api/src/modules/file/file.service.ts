import { FileModel, IFile, FileHistoryModel, FileDocumentModel } from './file.model';
import { CreateFileInput, UpdateFileInput } from '@repo/shared';
import { Types } from 'mongoose';
import AdmZip from 'adm-zip';
import axios from 'axios';
import { AppError } from '../../common/utils/AppError';

/**
 * Generate next file number for a tenant
 * Starts from 1001
 */
async function getNextFileNo(tenantId: string): Promise<number> {
  const lastFile = (await FileModel.findOne({ tenantId })
    .sort({ fileNo: -1 })
    .select('fileNo')
    .lean()) as any;

  return lastFile ? lastFile.fileNo + 1 : 1001;
}

export const createFile = async (tenantId: string, userId: string, data: CreateFileInput): Promise<IFile> => {
  const fileNo = await getNextFileNo(tenantId);
  const fileNoFull = `IMP-EXP-${fileNo}`;

  const nodes = [
    'ARO', 'RO', 'AC', 'DC', 'JC1', 'JC2', 'JC3', 'ADC1', 'ADC2', 'COMMISSIONER'
  ].map(node => ({ node, status: 'PENDING' as const }));

  const file = await FileModel.create({
    ...data,
    tenantId,
    createdBy: userId,
    fileNo,
    fileNoFull,
    status: 'CREATED',
    assessment: { nodes }
  });

  // Record initial history
  await FileHistoryModel.create({
    tenantId,
    fileId: file._id,
    statusTo: 'CREATED',
    changedBy: userId,
    notes: 'File created'
  });

  return file;
};

import { ExpenseModel } from '../finance/finance.model';

export const listFiles = async (tenantId: string, query: {
  page?: number,
  limit?: number,
  status?: string,
  search?: string,
  clientId?: string
}) => {
  const { page = 1, limit = 20, status, search, clientId } = query;
  const skip = (page - 1) * limit;

  const filter: any = { tenantId, isDeleted: false };
  if (clientId) {
    filter.clientId = clientId;
  }
  if (status) {
    if (status === 'ACTIVE') {
      filter.status = { $in: ['CREATED', 'IGM_RECEIVED', 'BE_FILED', 'UNDER_ASSESSMENT', 'ASSESSMENT_COMPLETE', 'DUTY_PAID'] };
    } else {
      filter.status = status;
    }
  }
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

  // Aggregate expenses for these specific files
  const fileIds = files.map((f: any) => f._id);
  const expenses = await ExpenseModel.aggregate([
    { $match: { fileId: { $in: fileIds } } },
    { $group: { _id: '$fileId', total: { $sum: '$amount' } } }
  ]);

  const expenseMap = new Map(expenses.map(e => [e._id.toString(), e.total]));

  const filesWithExpenses = files.map((f: any) => ({
    ...f,
    totalExpenses: expenseMap.get(f._id.toString()) || 0
  }));

  return {
    files: filesWithExpenses,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getFile = async (tenantId: string, fileId: string): Promise<any> => {
  const [file, history, documents] = await Promise.all([
    FileModel.findOne({ _id: fileId, tenantId, isDeleted: false })
      .populate('clientId')
      .lean(),
    FileHistoryModel.find({ fileId, tenantId })
      .populate('changedBy', 'name')
      .sort({ createdAt: -1 })
      .lean(),
    FileDocumentModel.find({ fileId, tenantId })
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .lean()
  ]);

  if (!file) return null;

  return {
    ...file,
    history,
    documents
  };
};

export const updateFile = async (tenantId: string, userId: string, fileId: string, data: UpdateFileInput): Promise<any> => {
  const oldFile = await FileModel.findOne({ _id: fileId, tenantId }).select('status boeNumber assessmentValue igmNo igmDate deliveryOrderStatus gatePassNo');

  // Lifecycle Guards
  if (data.status && data.status !== oldFile?.status) {
    if (data.status === 'IGM_RECEIVED') {
      if (!data.igmNo && !oldFile?.igmNo) throw new AppError(400, 'GATE_LOCKED', 'IGM Number is required for this stage');
      if (!data.igmDate && !oldFile?.igmDate) throw new AppError(400, 'GATE_LOCKED', 'IGM Date is required for this stage');
    }

    if (data.status === 'BE_FILED' || data.status === 'UNDER_ASSESSMENT') {
      if (!data.boeNumber && !oldFile?.boeNumber) {
        throw new AppError(400, 'GATE_LOCKED', 'B/E Number (C-Number) is required for Filing/Assessment');
      }
    }

    if (data.status === 'DUTY_PAID') {
      const val = data.assessmentValue || oldFile?.assessmentValue;
      if (!val || val <= 0) {
        throw new AppError(400, 'GATE_LOCKED', 'Assessment Value must be recorded before Duty Payment');
      }
    }

    if (data.status === 'DELIVERED') {
      const hasDO = data.deliveryOrderStatus !== undefined ? data.deliveryOrderStatus : oldFile?.deliveryOrderStatus;
      const gatePass = data.gatePassNo || oldFile?.gatePassNo;
      
      if (!hasDO) throw new AppError(400, 'GATE_LOCKED', 'Delivery Order (D/O) must be received before delivery');
      if (!gatePass) throw new AppError(400, 'GATE_LOCKED', 'Gate Pass Number is required for port exit');
      
      if (oldFile?.status !== 'DUTY_PAID') {
         // Industry standard is strict on duty
         // throw new AppError(400, 'GATE_LOCKED', 'Cannot deliver goods before Duty is paid');
      }
    }
  }

  const updatedFile = await FileModel.findOneAndUpdate(
    { _id: fileId, tenantId },
    { $set: data },
    { new: true, runValidators: true }
  ).lean();

  if (updatedFile && data.status && data.status !== oldFile?.status) {
    await FileHistoryModel.create({
      tenantId,
      fileId,
      statusFrom: oldFile?.status,
      statusTo: data.status,
      changedBy: userId,
      notes: (data as any).statusNotes || `System Milestone: File transitioned from ${oldFile?.status || 'INIT'} to ${data.status.replace(/_/g, ' ')}.`
    });
  }

  return updatedFile;
};

export const updateAssessmentNode = async (
  tenantId: string, 
  userId: string, 
  fileId: string, 
  nodeName: string, 
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'SKIPPED',
  notes?: string
) => {
  const file = await FileModel.findOne({ _id: fileId, tenantId });
  if (!file) throw new Error('File not found');

  const nodeIndex = file.assessment.nodes.findIndex((n: any) => n.node === nodeName);
  if (nodeIndex === -1) throw new Error('Invalid assessment node');

  const update: any = {
    [`assessment.nodes.${nodeIndex}.status`]: status,
    [`assessment.nodes.${nodeIndex}.notes`]: notes
  };

  if (status === 'ACTIVE') {
    update[`assessment.nodes.${nodeIndex}.enteredAt`] = new Date();
    update['assessment.currentNode'] = nodeName;
  } else if (status === 'COMPLETED') {
    update[`assessment.nodes.${nodeIndex}.completedAt`] = new Date();
    // If completing the active node, clear current
    if (file.assessment.currentNode === nodeName) {
      update['assessment.currentNode'] = null;
    }
  }

  return FileModel.findOneAndUpdate(
    { _id: fileId, tenantId },
    { $set: update },
    { new: true }
  ).lean();
};

const ASSESSMENT_NODE_LIST = [
  'ARO', 'RO', 'AC', 'DC', 'JC1', 'JC2', 'JC3', 'ADC1', 'ADC2', 'COMMISSIONER'
];

async function ensureAssessmentNodes(file: any) {
  if (!file.assessment?.nodes || file.assessment.nodes.length === 0) {
    const nodes = ASSESSMENT_NODE_LIST.map(node => ({ node, status: 'PENDING' as const }));
    await FileModel.updateOne(
      { _id: file._id },
      { $set: { 'assessment.nodes': nodes } }
    );
    file.assessment = { ...file.assessment, nodes };
  }
}

export const transferAssessmentNode = async (
  tenantId: string,
  userId: string,
  fileId: string,
  targetNode: string
) => {
  const file = await FileModel.findOne({ _id: fileId, tenantId });
  if (!file) throw new AppError(404, 'NOT_FOUND', 'File not found');

  // Sync / Initialize nodes if missing (Robustness Fix)
  await ensureAssessmentNodes(file);

  const targetIndex = ASSESSMENT_NODE_LIST.indexOf(targetNode);
  if (targetIndex === -1) throw new AppError(400, 'INVALID_NODE', 'Invalid assessment node');

  const update: any = {
    'assessment.currentNode': targetNode,
    'status': 'UNDER_ASSESSMENT'
  };

  file.assessment.nodes.forEach((node: any, idx: number) => {
    const nodeName = node.node;
    const nodeIdx = ASSESSMENT_NODE_LIST.indexOf(nodeName);

    if (nodeName === targetNode) {
      update[`assessment.nodes.${idx}.status`] = 'ACTIVE';
      update[`assessment.nodes.${idx}.enteredAt`] = new Date();
    } else if (node.status === 'ACTIVE') {
      // Single-Active Logic: Previous active nodes become COMPLETED
      update[`assessment.nodes.${idx}.status`] = 'COMPLETED';
      update[`assessment.nodes.${idx}.completedAt`] = new Date();
    } else if (nodeIdx < targetIndex && node.status !== 'COMPLETED') {
      // Mark as SKIPPED if it's behind the target and NOT already COMPLETED
      update[`assessment.nodes.${idx}.status`] = 'SKIPPED';
      update[`assessment.nodes.${idx}.completedAt`] = new Date();
      update[`assessment.nodes.${idx}.notes`] = 'Skipped via Mission Control transfer';
    }
  });

  const updatedFile = await FileModel.findOneAndUpdate(
    { _id: fileId, tenantId },
    { $set: update },
    { new: true }
  ).lean();

  await FileHistoryModel.create({
    tenantId,
    fileId,
    statusTo: 'UNDER_ASSESSMENT',
    changedBy: userId,
    notes: `Assessment transferred to ${targetNode}. Previous ACTIVE nodes COMPLETED.`
  });

  return updatedFile;
};

export const resetAssessmentNode = async (
  tenantId: string,
  userId: string,
  fileId: string
) => {
  const file = await FileModel.findOne({ _id: fileId, tenantId });
  if (!file) throw new AppError(404, 'NOT_FOUND', 'File not found');

  // Robustness fix: Ensure nodes exist before mapping
  await ensureAssessmentNodes(file);

  const nodes = file.assessment.nodes.map((n: any) => ({
    ...n,
    status: 'PENDING',
    enteredAt: undefined,
    completedAt: undefined,
    notes: undefined
  }));

  const updatedFile = await FileModel.findOneAndUpdate(
    { _id: fileId, tenantId },
    { 
      $set: { 
        'assessment.nodes': nodes,
        'assessment.currentNode': null
      } 
    },
    { new: true }
  ).lean();

  await FileHistoryModel.create({
    tenantId,
    fileId,
    statusTo: file.status, // Required field
    changedBy: userId,
    notes: 'Assessment workflow reset to initial state.'
  });

  return updatedFile;
};

export const addFileDocument = async (tenantId: string, userId: string, fileId: string, data: {
  name: string,
  url: string,
  type: string,
  category: 'COPY' | 'ORIGINAL',
  size?: number
}) => {
  return FileDocumentModel.create({
    ...data,
    tenantId,
    fileId,
    uploadedBy: userId
  });
};

export const deleteFileDocument = async (tenantId: string, fileId: string, docId: string) => {
  return FileDocumentModel.deleteOne({ _id: docId, fileId, tenantId });
};

export const deleteFile = async (tenantId: string, fileId: string): Promise<boolean> => {
  const result = await FileModel.updateOne(
    { _id: fileId, tenantId },
    { $set: { isDeleted: true, deletedAt: new Date() } }
  );
  return result.modifiedCount > 0;
};

export const downloadDocuments = async (tenantId: string, fileId: string): Promise<{ buffer: Buffer; fileName: string }> => {
  const [file, documents] = await Promise.all([
    FileModel.findOne({ _id: fileId, tenantId }),
    FileDocumentModel.find({ fileId, tenantId }).lean()
  ]);

  if (!file) throw new Error('File not found');

  const zip = new AdmZip();
  
  await Promise.all(documents.map(async (doc: any) => {
    try {
      const response = await axios.get(doc.url, { responseType: 'arraybuffer' });
      const folder = doc.category === 'ORIGINAL' ? 'original' : 'copy';
      zip.addFile(`${folder}/${doc.name}`, Buffer.from(response.data));
    } catch (err) {
      console.error(`Failed to download document ${doc.name}:`, err);
    }
  }));

  return {
    buffer: zip.toBuffer(),
    fileName: `${file.fileNoFull}_documents.zip`
  };
};

export const updateDocStatus = async (tenantId: string, fileId: string, data: { copyDocsReceived?: boolean, originalDocsReceived?: boolean }) => {
  return FileModel.findOneAndUpdate(
    { _id: fileId, tenantId },
    { $set: data },
    { new: true }
  ).lean();
};
