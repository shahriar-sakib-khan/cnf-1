import bcrypt from 'bcryptjs';
import { UserModel } from './user.model';
import { StoreModel } from './store.model';
import { signToken } from '../../common/utils/jwt.utils';
import { CreateOwnerInput, CreateStaffInput, UpdateProfileInput, UpdateStaffInput } from '@repo/shared';

// ── Unified login (email or phone) ──────────────────────
export const login = async (identifier: string, password: string) => {
  const trimmedId = identifier.trim();
  const userRecord = await UserModel.findOne({
    $or: [{ email: trimmedId.toLowerCase() }, { phone: trimmedId }],
  }).select('+password').lean() as any;

  if (!userRecord || !userRecord.isActive) throw new Error('Invalid credentials');

  const isMatch = await bcrypt.compare(password, userRecord.password as string);
  if (!isMatch) throw new Error('Invalid credentials');

  const token = signToken({
    id: userRecord._id.toString(),
    type: userRecord.userType,
    role: userRecord.role as any,
    tenantId: userRecord.tenantId?.toString(),
    tokenVersion: userRecord.tokenVersion,
  });

  const userObj = { ...userRecord } as Record<string, unknown>;
  delete userObj.password;
  return { user: userObj, token };
};

// ── Admin creates a new Owner + their Store ──────────────
export const createOwner = async (data: CreateOwnerInput, adminId: string) => {
  if (data.email) {
    const exists = await UserModel.findOne({ email: data.email.toLowerCase() }).lean() as any;
    if (exists) throw new Error('Email already in use');
  }
  if (data.phone) {
    const exists = await UserModel.findOne({ phone: data.phone }).lean() as any;
    if (exists) throw new Error('Phone already in use');
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  // 1. Create user
  const user = await UserModel.create({
    name: data.name?.trim(),
    email: data.email?.toLowerCase() || undefined,
    phone: data.phone || undefined,
    password: hashedPassword,
    userType: 'USER',
    role: 'OWNER',
    createdBy: adminId,
  });

  // 2. Create their store
  let store;
  try {
    // 2. Create Store linked to this owner
    // Use identifier (email or phone) as part of store name if name is missing
    const identifier = data.email || data.phone || 'New';
    const storeName = `${data.name || identifier}'s Store`;
    store = await StoreModel.create({
      name: storeName,
      ownerId: user._id,
      createdBy: adminId
    });
  } catch (err) {
    await UserModel.deleteOne({ _id: user._id });
    throw err;
  }

  // 3. Link tenantId back
  await UserModel.findByIdAndUpdate(user._id, { tenantId: store._id });

  const userObj = user.toJSON() as any;
  delete userObj.password;
  userObj.tenantId = store._id;
  return userObj;
};

// ── Owner creates a staff member (or another owner) in their store ──
export const createStaffMember = async (ownerId: string, data: CreateStaffInput) => {
  const owner = await UserModel.findById(ownerId).select('+password').lean() as any;
  if (!owner || owner.role !== 'OWNER' || !owner.tenantId) {
    throw new Error('Only store owners can create new accounts');
  }

  // If creating an OWNER, verify the current owner's password
  if (data.role === 'OWNER') {
    if (!data.creatorPassword) {
      throw new Error('Current owner password is required to create a new owner');
    }
    const isMatch = await bcrypt.compare(data.creatorPassword, owner.password as string);
    if (!isMatch) {
      throw new Error('Incorrect owner password. Authorization failed.');
    }
  }

  if (data.email) {
    const c = await UserModel.findOne({ email: data.email.toLowerCase() }).lean() as any;
    if (c) throw new Error('Email already in use');
  }
  if (data.phone) {
    const c = await UserModel.findOne({ phone: data.phone }).lean() as any;
    if (c) throw new Error('Phone already in use');
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const staff = await UserModel.create({
    name: data.name,
    email: data.email?.toLowerCase() || undefined,
    phone: data.phone || undefined,
    password: hashedPassword,
    userType: 'USER',
    role: data.role,
    tenantId: owner.tenantId,
    createdBy: ownerId,
  });

  const staffObj = staff.toJSON() as Record<string, unknown>;
  delete staffObj.password;
  return staffObj;
};

// ── List all user-type users (admin view) ────────────────
export const listAllOwners = async () => {
  const owners = await UserModel.find({ userType: 'USER', role: 'OWNER' })
    .populate('tenantId')
    .lean() as any;

  const results = await Promise.all(owners.map(async (owner: any) => {
    const staff = await UserModel.find({
      tenantId: owner.tenantId,
      _id: { $ne: owner._id }
    }).select('-password').lean() as any;

    return {
      ...owner,
      staff
    };
  }));

  return results;
};

// ── List all users in a store (including OWNERs) ──────────
export const listStoreStaff = async (tenantId: string) => {
  return UserModel.find({ tenantId })
    .select('-password')
    .lean() as any;
};

// ── Get current user ─────────────────────────────────────
export const getMe = async (id: string) => UserModel.findById(id).lean() as any;

// ── Change password (user self-service) ──────────────────
export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const user = await UserModel.findById(userId).select('+password').lean() as any;
  if (!user) throw new Error('User not found');
  const match = await bcrypt.compare(currentPassword, user.password as string);
  if (!match) throw new Error('Current password is incorrect');
  const hashed = await bcrypt.hash(newPassword, 10);
  await UserModel.findByIdAndUpdate(userId, { password: hashed, $inc: { tokenVersion: 1 } });
};

// ── Admin Reset Password (override) ──────────────────────
export const adminResetUserPassword = async (userId: string, newPassword: string) => {
  const hashed = await bcrypt.hash(newPassword, 10);
  await UserModel.findByIdAndUpdate(userId, {
    password: hashed,
    $inc: { tokenVersion: 1 } // Force logout of all existing sessions
  });
};

// ── Update Profile (user self-service) ───────────────────
export const updateProfile = async (userId: string, data: UpdateProfileInput) => {
  if (data.email) {
    const exists = await UserModel.findOne({ email: data.email.toLowerCase(), _id: { $ne: userId } }).lean() as any;
    if (exists) throw new Error('Email already in use by another user');
  }
  if (data.phone) {
    const exists = await UserModel.findOne({ phone: data.phone, _id: { $ne: userId } }).lean() as any;
    if (exists) throw new Error('Phone already in use by another user');
  }

  const updateFields: any = {};
  if (data.name !== undefined) updateFields.name = data.name;
  if (data.email !== undefined) updateFields.email = data.email === '' ? null : data.email.toLowerCase();
  if (data.phone !== undefined) updateFields.phone = data.phone === '' ? null : data.phone;

  const user = await UserModel.findByIdAndUpdate(userId, updateFields, { new: true }).select('-password').lean() as any;
  if (!user) throw new Error('User not found');
  return user;
};

// ── Update Staff (Owner/Manager power) ──────────────────
export const updateStaffMember = async (tenantId: string, userId: string, data: UpdateStaffInput) => {
  const user = await UserModel.findOne({ _id: userId, tenantId }).lean() as any;
  if (!user) throw new Error('Staff member not found in this store');

  if (data.email) {
    const exists = await UserModel.findOne({ email: data.email.toLowerCase(), _id: { $ne: userId } }).lean() as any;
    if (exists) throw new Error('Email already in use');
  }
  if (data.phone) {
    const exists = await UserModel.findOne({ phone: data.phone, _id: { $ne: userId } }).lean() as any;
    if (exists) throw new Error('Phone already in use');
  }

  const updateFields: any = {};
  if (data.name !== undefined) updateFields.name = data.name;
  if (data.email !== undefined) updateFields.email = data.email === '' ? null : data.email.toLowerCase();
  if (data.phone !== undefined) updateFields.phone = data.phone === '' ? null : data.phone;
  if (data.role !== undefined) updateFields.role = data.role;
  if (data.isActive !== undefined) updateFields.isActive = data.isActive;

  const updated = await UserModel.findByIdAndUpdate(userId, updateFields, { new: true }).select('-password').lean() as any;
  return updated;
};

// ── Tenant Owner Resets Staff Password ───────────────────
export const tenantResetStaffPassword = async (tenantId: string, userId: string, newPassword: string) => {
  const staff = await UserModel.findOne({ _id: userId, tenantId }).lean() as any;
  if (!staff) throw new Error('Staff member not found in this store');
  if (staff.role === 'OWNER') throw new Error('Cannot reset another owner\'s password via this route');

  const hashed = await bcrypt.hash(newPassword, 10);
  await UserModel.findByIdAndUpdate(userId, {
    password: hashed,
    $inc: { tokenVersion: 1 }
  });
};
