import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes';
import adminRoutes from './modules/admin/admin.routes';
import storeRoutes from './modules/store/store.routes';
import clientRoutes from './modules/client/client.routes';
import fileRoutes from './modules/file/file.routes';
import financeRoutes from './modules/finance/finance.routes';
import uploadRoutes from './modules/upload/upload.routes';
import reportRoutes from './modules/report/report.routes';
import { configureCloudinary } from './common/services/cloudinary.service';

dotenv.config();

// Mandatory Environment Variables Check
const requiredEnv = ['MONGODB_URI', 'JWT_SECRET'];
requiredEnv.forEach((env) => {
  if (!process.env[env] && !process.env.MONGO_URI) {
    console.error(`[CRITICAL] Missing environment variable: ${env}`);
  }
});

console.log('[DEBUG] NODE_ENV:', process.env.NODE_ENV);
console.log('[DEBUG] PORT:', process.env.PORT);
console.log('[DEBUG] MONGODB_URI:', process.env.MONGODB_URI ? 'FOUND (HIDDEN)' : 'NOT FOUND');

configureCloudinary();

// Critical Error Listeners
process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
  process.exit(1);
});

const app: Express = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5175'
  ],
  credentials: true,
}));
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reports', reportRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);

  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let details = undefined;

  // Handle Zod Validation Errors
  if (err.name === 'ZodError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = err.errors;
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' || details ? { details : details || err.stack } : {}),
    }
  });
});

// Database Connection & Server Start
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/cnfnexus';

if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(MONGO_URI)

    .then(() => {
      console.log('Connected to MongoDB');
      const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
      
      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`[CRITICAL] Port ${PORT} is already in use.`);
          process.exit(1);
        } else {
          console.error('[CRITICAL] Server error:', err);
        }
      });
    })
    .catch((error) => {
      console.error('[CRITICAL] MongoDB connection error:', error);
      process.exit(1); // Force exit so Render knows it failed
    });
}

export default app;
