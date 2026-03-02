import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';
import { FileModel } from './file.model';
import { ClientModel } from '../client/client.model';
import { UserModel } from '../auth/user.model';
import { StoreModel } from '../auth/store.model';
import { signToken } from '../../common/utils/jwt.utils';

describe('File Module', () => {
  let ownerToken: string;
  let otherToken: string;
  let clientId: string;
  let sharedFileId: string;

  beforeAll(async () => {
    try {
      console.log('CONNECTING TO DB...');
      await mongoose.connect('mongodb://127.0.0.1:27017/cnfnexus_test_file');
      console.log('CONNECTED');
      if (mongoose.connection.db) {
        await mongoose.connection.db.dropDatabase();
        console.log('DATABASE DROPPED');
      }
    } catch (err) {
      console.error('BEFOREALL ERROR:', err);
      throw err;
    }

    // 1. Setup Tenant A (Owner)
    const userA = await UserModel.create({ 
      name: 'Owner A', 
      email: 'owner-a@test.com', 
      password: 'hashed_password', // Skip bcrypt for speed/stability
      role: 'OWNER',
      userType: 'USER'
    });
    const storeA = await StoreModel.create({ name: 'Store A', ownerId: userA._id });
    await UserModel.updateOne({ _id: userA._id }, { tenantId: storeA._id });
    
    ownerToken = signToken({ 
      id: userA._id.toString(), 
      tenantId: storeA._id.toString(), 
      role: 'OWNER', 
      type: 'USER',
      tokenVersion: 0 
    });

    // 2. Setup Tenant B (Isolation)
    const userB = await UserModel.create({ 
      name: 'Owner B', 
      email: 'owner-b@test.com', 
      password: 'hashed_password',
      role: 'OWNER', 
      userType: 'USER'
    });
    const storeB = await StoreModel.create({ name: 'Store B', ownerId: userB._id });
    await UserModel.updateOne({ _id: userB._id }, { tenantId: storeB._id });
    
    otherToken = signToken({ 
      id: userB._id.toString(), 
      tenantId: storeB._id.toString(), 
      role: 'OWNER', 
      type: 'USER',
      tokenVersion: 0 
    });

    // 3. Setup Client
    const client = await ClientModel.create({
      name: 'Test Client',
      tenantId: storeA._id,
      type: 'IMPORTER'
    });
    clientId = client._id.toString();

    // 4. Create a shared file for testing updates/guards
    const file = await FileModel.create({
      tenantId: storeA._id,
      clientId: client._id,
      fileNo: 1001,
      fileNoFull: 'IMP-EXP-1001',
      blNo: 'SHARED-BL-123',
      blDate: new Date(),
      description: 'Test File',
      invoiceValue: 500000,
      status: 'CREATED',
      assessment: {
        nodes: [
          'ARO', 'RO', 'AC', 'DC', 'JC1', 'JC2', 'JC3', 'ADC1', 'ADC2', 'COMMISSIONER'
        ].map(node => ({ node, status: 'PENDING' as const }))
      },
      createdBy: userA._id
    });
    sharedFileId = file._id.toString();
  });

  afterAll(async () => {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
    await mongoose.disconnect();
  });

  it('should list files for the current tenant', async () => {
    const res = await request(app)
      .get('/api/files')
      .set('Cookie', [`token=${ownerToken}`]);
    expect(res.status).toBe(200);
    expect(res.body.files.length).toBeGreaterThanOrEqual(1);
  });

  it('should isolate data between tenants', async () => {
    const res = await request(app)
      .get('/api/files')
      .set('Cookie', [`token=${otherToken}`]);
    expect(res.status).toBe(200);
    expect(res.body.files.length).toBe(0);
  });

  describe('Lifecycle Guards', () => {
    it('should block IGM_RECEIVED without IGM details', async () => {
      const res = await request(app)
        .put(`/api/files/${sharedFileId}`)
        .set('Cookie', [`token=${ownerToken}`])
        .send({ status: 'IGM_RECEIVED' });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('IGM Number is required');
    });

    it('should block BE_FILED without B/E Number', async () => {
      const res = await request(app)
        .put(`/api/files/${sharedFileId}`)
        .set('Cookie', [`token=${ownerToken}`])
        .send({ status: 'BE_FILED' });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('B/E Number');
    });

    it('should allow BE_FILED with B/E Number', async () => {
      const res = await request(app)
        .put(`/api/files/${sharedFileId}`)
        .set('Cookie', [`token=${ownerToken}`])
        .send({ status: 'BE_FILED', boeNumber: 'C-999', beDate: new Date() });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('BE_FILED');
    });
  });

  describe('Assessment Nodes', () => {
    it('should update assessment status', async () => {
      const res = await request(app)
        .post(`/api/files/${sharedFileId}/assessment`)
        .set('Cookie', [`token=${ownerToken}`])
        .send({ node: 'ARO', status: 'ACTIVE' });
      expect(res.status).toBe(200);
      expect(res.body.data.assessment.currentNode).toBe('ARO');
    });
  });
});
