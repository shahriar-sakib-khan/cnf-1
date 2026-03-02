import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app';
import { StoreModel } from '../auth/store.model';
import { UserModel } from '../auth/user.model';
import { MoneyRequestModel, ExpenseModel, LedgerEventModel } from './finance.model';
import { ExpenseCategoryModel } from './expense-category.model';
import { signToken } from '../../common/utils/jwt.utils';
import bcrypt from 'bcryptjs';

describe('Finance Module (Law II Isolation)', () => {
  let ownerToken: string;
  let staffToken: string;
  let otherToken: string;
  let staffId: string;
  let categoryId: string;

  beforeAll(async () => {
    try {
      console.log('--- TEST START ---');
      await mongoose.connect('mongodb://localhost:27017/cnfnexus_test_finance');
      console.log('--- CONNECTED ---');
      if (mongoose.connection.db) {
         await mongoose.connection.db.dropDatabase();
         console.log('--- DB DROPPED ---');
      }

      // Setup Tenant 1 (OWNER + STAFF)
      console.log('--- CREATING STORE 1 ---');
      const store1 = await StoreModel.create({ name: 'Store 1' });
      console.log('--- STORE 1 CREATED ---', store1?._id);

      const p = await bcrypt.hash('password123', 10);
      console.log('--- CREATING OWNER 1 ---');
      const owner = await UserModel.create({
        name: 'Owner 1',
        email: 'owner1@test.com',
        password: p,
        role: 'OWNER',
        tenantId: store1._id,
        isActive: true
      });
      console.log('--- OWNER 1 CREATED ---', owner._id);
      ownerToken = signToken({ id: owner._id.toString(), type: 'USER', role: 'OWNER', tenantId: store1._id.toString(), tokenVersion: 0 });

      const staff = await UserModel.create({
        name: 'Staff 1',
        email: 'staff1@test.com',
        password: p,
        role: 'STAFF',
        tenantId: store1._id,
        isActive: true
      });
      console.log('--- STAFF 1 CREATED ---');
      staffId = staff._id.toString();
      staffToken = signToken({ id: staff._id.toString(), type: 'USER', role: 'STAFF', tenantId: store1._id.toString(), tokenVersion: 0 });

      const cat = await ExpenseCategoryModel.create({
        tenantId: store1._id,
        name: 'TRANSPORT'
      });
      console.log('--- CATEGORY CREATED ---');
      categoryId = cat._id.toString();

      // Setup Tenant 2 (ISOLATION)
      const store2 = await StoreModel.create({ name: 'Store 2' });
      const otherOwner = await UserModel.create({
        name: 'Owner 2',
        email: 'owner2@test.com',
        password: p,
        role: 'OWNER',
        tenantId: store2._id,
        isActive: true
      });
      console.log('--- OWNER 2 CREATED ---');
      otherToken = signToken({ id: otherOwner._id.toString(), type: 'USER', role: 'OWNER', tenantId: store2._id.toString(), tokenVersion: 0 });
    } catch (err: any) {
      console.error('FAILED IN BEFOREALL:', err);
      if (err.errors) {
        Object.keys(err.errors).forEach(key => {
          console.error(`- Field "${key}": ${err.errors[key].message}`);
        });
      }
      throw err;
    }
  });

  afterAll(async () => {
    await mongoose.connection.db?.dropDatabase();
    await mongoose.disconnect();
  });

  describe('Money Requests & Settlement', () => {
    let requestId: string;

    it('Staff should create a money request', async () => {
      const res = await request(app)
        .post('/api/finance/requests')
        .set('Cookie', [`token=${staffToken}`])
        .send({ amount: 5000, purpose: 'Field Work' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(5000);
      requestId = res.body.data._id;
    });

    it('Owner should approve the request', async () => {
      const res = await request(app)
        .put(`/api/finance/requests/${requestId}/approve`)
        .set('Cookie', [`token=${ownerToken}`])
        .send({ grantedAmount: 4500 }); // Partial grant

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('APPROVED');
      expect(res.body.data.grantedAmount).toBe(4500);

      const staff = await UserModel.findById(staffId);
      expect(staff?.balanceTaka).toBe(4500);
    });

    it('Staff should record an expense (Settle)', async () => {
      const res = await request(app)
        .post('/api/finance/settle')
        .set('Cookie', [`token=${staffToken}`])
        .send({
          amount: 2000,
          category: categoryId,
          description: 'Transport for file XYZ',
          requestId
        });

      if (res.status !== 201) console.error(JSON.stringify(res.body, null, 2));
      expect(res.status).toBe(201);
      expect(res.body.data.amount).toBe(2000);

      const staff = await UserModel.findById(staffId);
      expect(staff?.balanceTaka).toBe(2500); // 4500 - 2000
    });
  });

  describe('Tenant Isolation (Law II)', () => {
    it('Owner 2 should NOT see Store 1 requests', async () => {
      const res = await request(app)
        .get('/api/finance/requests')
        .set('Cookie', [`token=${otherToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });

    it('Staff 1 should NOT be able to list all store requests (Auth Check)', async () => {
      const res = await request(app)
        .get('/api/finance/requests')
        .set('Cookie', [`token=${staffToken}`]);

      expect(res.status).toBe(403);
    });
  });
});
