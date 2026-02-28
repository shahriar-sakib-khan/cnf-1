import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app';
import { StoreModel } from '../auth/store.model';
import { UserModel } from '../auth/user.model';
import { ClientModel } from './client.model';
import { signToken } from '../../common/utils/jwt.utils';
import bcrypt from 'bcryptjs';

describe('Client Module', () => {
  let user1Token: string;
  let user2Token: string;
  let client1Id: string;

  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/cnfnexus_test_client');
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }

    // Setup User 1 (OWNER) + Store 1
    const p1 = await bcrypt.hash('pass1', 10);
    const u1 = await UserModel.create({ name: 'U1', email: 'u1@test.com', password: p1, userType: 'USER', role: 'OWNER' });
    const s1 = await StoreModel.create({ ownerId: u1._id, name: 'Store 1' });
    await UserModel.updateOne({ _id: u1._id }, { storeId: s1._id });
    user1Token = signToken({ id: u1._id.toString(), type: 'USER', role: 'OWNER', storeId: s1._id.toString(), tokenVersion: 0 });

    // Setup User 2 (OWNER) + Store 2
    const p2 = await bcrypt.hash('pass2', 10);
    const u2 = await UserModel.create({ name: 'U2', email: 'u2@test.com', password: p2, userType: 'USER', role: 'OWNER' });
    const s2 = await StoreModel.create({ ownerId: u2._id, name: 'Store 2' });
    await UserModel.updateOne({ _id: u2._id }, { storeId: s2._id });
    user2Token = signToken({ id: u2._id.toString(), type: 'USER', role: 'OWNER', storeId: s2._id.toString(), tokenVersion: 0 });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('CRUD Operations & Tenant Isolation', () => {
    it('User 1 should create a client', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Cookie', [`token=${user1Token}`])
        .send({
          name: 'Global Impex',
          type: 'IMPORTER',
          email: 'test@global.com'
        });

      if (res.status !== 201) console.error(res.body);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Global Impex');
      client1Id = res.body.data._id;
    });

    it('User 1 should list clients', async () => {
      const res = await request(app)
        .get('/api/clients')
        .set('Cookie', [`token=${user1Token}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Global Impex');
    });

    it('User 2 should NOT see User 1s client (Tenant Isolation)', async () => {
      const res = await request(app)
        .get('/api/clients')
        .set('Cookie', [`token=${user2Token}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });

    it('User 2 should NOT be able to delete User 1s client', async () => {
      const res = await request(app)
        .delete(`/api/clients/${client1Id}`)
        .set('Cookie', [`token=${user2Token}`]);

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });

    it('User 1 should update their client', async () => {
      const res = await request(app)
        .put(`/api/clients/${client1Id}`)
        .set('Cookie', [`token=${user1Token}`])
        .send({ phone: '12345' });

      expect(res.status).toBe(200);
      expect(res.body.data.phone).toBe('12345');
    });

    it('User 1 should soft delete their client', async () => {
      const res = await request(app)
        .delete(`/api/clients/${client1Id}`)
        .set('Cookie', [`token=${user1Token}`]);

      expect(res.status).toBe(200);

      const listRes = await request(app)
        .get('/api/clients')
        .set('Cookie', [`token=${user1Token}`]);
      expect(listRes.body.data.length).toBe(0);

      const dbRecord = await ClientModel.findById(client1Id);
      expect(dbRecord?.isDeleted).toBe(true);
    });
  });
});
