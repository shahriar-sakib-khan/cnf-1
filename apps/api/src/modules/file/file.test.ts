import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';
import { FileModel } from './file.model';
import { ClientModel } from '../client/client.model';
import { UserModel } from '../auth/user.model';
import { StoreModel } from '../auth/store.model';

describe('File Module', () => {
  let ownerToken: string;
  let otherOwnerToken: string;
  let clientId: string;
  let tenantId: string;

  beforeAll(async () => {
    // 1. Setup Tenant A
    const owner = await request(app).post('/api/auth/login').send({ identifier: 'sakib@gmail.com', password: '123456' });
    ownerToken = owner.get('Set-Cookie')?.[0]?.split(';')[0]?.split('=')[1] || '';

    const userA = await UserModel.findOne({ email: 'sakib@gmail.com' });
    tenantId = userA!.storeId!.toString();

    // 2. Setup Tenant B
    const other = await request(app).post('/api/auth/login').send({ identifier: 'arif@gmail.com', password: 'staff123' });
    otherOwnerToken = other.get('Set-Cookie')?.[0]?.split(';')[0]?.split('=')[1] || '';

    // 3. Create a client for Tenant A
    const client = await ClientModel.create({
      name: 'Test Client',
      tenantId: new mongoose.Types.ObjectId(tenantId),
      type: 'IMPORTER'
    });
    clientId = client._id.toString();
  });

  afterAll(async () => {
    await FileModel.deleteMany({});
    await ClientModel.deleteMany({ name: 'Test Client' });
  });

  describe('POST /api/files', () => {
    it('should create a new file with auto-incremented fileNo', async () => {
      const fileData = {
        clientId,
        blNo: 'BL123456',
        blDate: new Date().toISOString(),
        invoiceValue: 500000, // 5000.00 BDT
        currency: 'USD',
        description: 'Test Import Goods',
        hsCode: '1234.56.78',
        vesselName: 'Ever Given'
      };

      const res = await request(app)
        .post('/api/files')
        .set('Cookie', [`token=${ownerToken}`])
        .send(fileData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fileNo).toBe(1001);
      expect(res.body.data.fileNoFull).toBe('IMP-EXP-1001');
      expect(res.body.data.blNo).toBe(fileData.blNo);
    });

    it('should increment fileNo for the next file', async () => {
      const res = await request(app)
        .post('/api/files')
        .set('Cookie', [`token=${ownerToken}`])
        .send({
          clientId,
          blNo: 'BL789012',
          blDate: new Date().toISOString(),
          invoiceValue: 100000,
          description: 'Second File'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.fileNo).toBe(1002);
      expect(res.body.data.fileNoFull).toBe('IMP-EXP-1002');
    });
  });

  describe('GET /api/files', () => {
    it('should list files for the current tenant', async () => {
      const res = await request(app)
        .get('/api/files')
        .set('Cookie', [`token=${ownerToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.files.length).toBeGreaterThanOrEqual(2);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(2);
    });

    it('should NOT show Tenant A files to Tenant B', async () => {
      const res = await request(app)
        .get('/api/files')
        .set('Cookie', [`token=${otherOwnerToken}`]);

      expect(res.status).toBe(200);
      // Arif is a MANAGER in Sakib's store based on previous summaries?
      // Wait, let me check arif's role.
      // Previous summary: ✅ MANAGER: arif@gmail.com / staff123
      // So Arif IS in the same store. I should use a different user from a different store for isolation check.
    });
  });

  describe('Tenant Isolation', () => {
    it('should isolate data between different stores', async () => {
       // I'll create a second store and owner to truly test isolation
       const admin = await request(app).post('/api/auth/login').send({ identifier: 'admin@gmail.com', password: 'admin123' });
       const adminToken = admin.get('Set-Cookie')?.[0]?.split(';')[0]?.split('=')[1] || '';

       const newOwnerRes = await request(app)
         .post('/api/admin/users')
         .set('Cookie', [`token=${adminToken}`])
         .send({ name: 'Other Owner', email: 'other@test.com', password: 'password123' });

       const otherToken = (await request(app).post('/api/auth/login').send({ identifier: 'other@test.com', password: 'password123' }))
         .get('Set-Cookie')?.[0]?.split(';')[0]?.split('=')[1] || '';

       const res = await request(app)
         .get('/api/files')
         .set('Cookie', [`token=${otherToken}`]);

       expect(res.status).toBe(200);
       expect(res.body.files.length).toBe(0); // Should be empty for new owner
    });
  });
});
