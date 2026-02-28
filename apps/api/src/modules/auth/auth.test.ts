import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app';
import { UserModel } from './user.model';
import { StoreModel } from './store.model';

describe('Auth Module', () => {
  let adminToken: string;
  let ownerToken: string;
  let storeId: string;
  let staffToken: string;

  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/cnfnexus_test');
    if (mongoose.connection.db) await mongoose.connection.db.dropDatabase();
    await UserModel.createCollection();
    await StoreModel.createCollection();

    // Seed an admin user directly (bypassing API — scripts-only creation)
    const bcrypt = await import('bcryptjs');
    await UserModel.create({
      name: 'Admin',
      email: 'admin@test.com',
      password: await bcrypt.default.hash('admin123', 10),
      userType: 'ADMIN',
      role: 'OWNER',
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  // ── Admin Login ────────────────────────────────────────
  describe('Admin Login', () => {
    it('should login as admin and get ADMIN userType', async () => {
      const res = await request(app).post('/api/auth/login').send({
        identifier: 'admin@test.com',
        password: 'admin123',
      });
      expect(res.status).toBe(200);
      expect(res.body.data.userType).toBe('ADMIN');
      const cookies = (res.headers['set-cookie'] as unknown) as string[];
      adminToken = cookies[0].split(';')[0].split('=')[1];
    });

    it('should reject wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        identifier: 'admin@test.com', password: 'wrong',
      });
      expect(res.status).toBe(500);
    });

    it('should reject unknown identifier', async () => {
      const res = await request(app).post('/api/auth/login').send({
        identifier: 'nobody@test.com', password: 'anything',
      });
      expect(res.status).toBe(500);
    });
  });

  // ── Admin creates Owner ────────────────────────────────
  describe('Admin Creates Owner (POST /admin/users)', () => {
    it('should create a new owner and auto-create a store', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Cookie', [`token=${adminToken}`])
        .send({ name: 'Test Owner', email: 'owner@test.com', password: 'pass123' });

      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe('OWNER');
      expect(res.body.data.userType).toBe('USER');

      const store = await StoreModel.findOne({ ownerId: res.body.data._id });
      expect(store).toBeDefined();
      expect(store?.name).toBe("Test Owner's Store");
      storeId = store!._id.toString();
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Cookie', [`token=${adminToken}`])
        .send({ name: 'Dup Owner', email: 'owner@test.com', password: 'pass123' });
      expect(res.status).toBe(500);
    });

    it('should reject non-admin trying to create owner', async () => {
      // Without token
      const res = await request(app)
        .post('/api/admin/users')
        .send({ name: 'Rogue', email: 'rogue@test.com', password: 'pass123' });
      expect(res.status).toBe(401);
    });
  });

  // ── Owner Login ────────────────────────────────────────
  describe('Owner Login', () => {
    it('should login as owner and get USER userType', async () => {
      const res = await request(app).post('/api/auth/login').send({
        identifier: 'owner@test.com', password: 'pass123',
      });
      expect(res.status).toBe(200);
      expect(res.body.data.userType).toBe('USER');
      expect(res.body.data.role).toBe('OWNER');
      const cookies = (res.headers['set-cookie'] as unknown) as string[];
      ownerToken = cookies[0].split(';')[0].split('=')[1];
    });
  });

  // ── Owner creates Staff ────────────────────────────────
  describe('Owner Creates Staff (POST /store/staff)', () => {
    it('should allow owner to create a MANAGER', async () => {
      const res = await request(app)
        .post('/api/store/staff')
        .set('Cookie', [`token=${ownerToken}`])
        .send({ name: 'Test Manager', email: 'manager@test.com', password: 'staffpass123', role: 'MANAGER' });
      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe('MANAGER');
      expect(res.body.data.storeId.toString()).toBe(storeId);
    });

    it('should allow owner to create STAFF by phone only', async () => {
      const res = await request(app)
        .post('/api/store/staff')
        .set('Cookie', [`token=${ownerToken}`])
        .send({ name: 'Test Staff', phone: '0987654321', password: 'staffpass123', role: 'STAFF' });
      expect(res.status).toBe(201);
      expect(res.body.data.storeId.toString()).toBe(storeId);
    });

    it('should allow staff to login by phone', async () => {
      const res = await request(app).post('/api/auth/login').send({
        identifier: '0987654321', password: 'staffpass123',
      });
      expect(res.status).toBe(200);
      const cookies = (res.headers['set-cookie'] as unknown) as string[];
      staffToken = cookies[0].split(';')[0].split('=')[1];
    });

    it('should prevent non-owners from creating staff', async () => {
      const res = await request(app)
        .post('/api/store/staff')
        .set('Cookie', [`token=${staffToken}`])
        .send({ name: 'Rogue', email: 'rogue@test.com', password: 'roguepass', role: 'STAFF' });
      expect(res.status).toBe(500); // service throws "Only owners can create staff"
    });
  });

  // ── Me Endpoint ────────────────────────────────────────
  describe('Me Endpoint', () => {
    it('should return authenticated user data', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`token=${ownerToken}`]);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('owner@test.com');
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should allow creating an owner without a name (uses email as default)', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Cookie', [`token=${adminToken}`])
        .send({ email: 'noname@test.com', password: 'pass123' });

      expect(res.status).toBe(201);
      const store = await StoreModel.findOne({ ownerId: res.body.data._id });
      expect(store?.name).toBe("noname@test.com's Store");
    });

    // 🛡️ Admin cannot access admin routes without admin token
    it('should reject non-admin from /admin/users', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Cookie', [`token=${ownerToken}`]); // owner token, not admin
      expect(res.status).toBe(403);
    });

    it('should allow admin to see owner with nested staff', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Cookie', [`token=${adminToken}`]);

      expect(res.status).toBe(200);
      const testOwner = res.body.data.find((o: any) => o.email === 'owner@test.com');
      expect(testOwner).toBeDefined();
      expect(testOwner.storeId).toBeDefined();
      expect(testOwner.storeId.name).toBe("Test Owner's Store");
      expect(testOwner.staff).toBeDefined();
      expect(testOwner.staff.length).toBeGreaterThan(0);
      expect(testOwner.staff[0].name).toBe('Test Manager');
    });

    it('should allow admin to reset any user password', async () => {
      // Find the manager user
      const manager = await UserModel.findOne({ email: 'manager@test.com' });
      expect(manager).toBeDefined();

      const res = await request(app)
        .put(`/api/admin/users/${manager!._id}/password`)
        .set('Cookie', [`token=${adminToken}`])
        .send({ newPassword: 'newmanagerpass' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify the new password works
      const loginRes = await request(app).post('/api/auth/login').send({
        identifier: 'manager@test.com',
        password: 'newmanagerpass',
      });
      expect(loginRes.status).toBe(200);
    });
  });
});

