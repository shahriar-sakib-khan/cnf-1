import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
const JWT_EXPIRES_IN = '24h';

export interface TokenPayload {
  id: string;
  type: 'ADMIN' | 'USER';
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  tenantId?: string;
  tokenVersion: number;
}

export const signToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};
