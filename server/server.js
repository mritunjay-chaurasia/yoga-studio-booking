import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import errorHandler from './middlewares/errorHandler.js';
import bootstrapStudio from './utils/bootstrap.js';
import indexRoutes from './routes/index.js';
import { validateEnv } from './utils/env.js';
import { apiLimiter } from './middlewares/rateLimiter.js';

dotenv.config();
validateEnv();

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));
app.use('/api', apiLimiter, indexRoutes);
app.use(errorHandler);

let server;

const shutdown = async (signal) => {
  console.log(`${signal} received — shutting down gracefully`);
  if (server) {
    server.close(async () => {
      await mongoose.disconnect();
      console.log('MongoDB disconnected');
      process.exit(0);
    });
  } else {
    await mongoose.disconnect();
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

const start = async () => {
  await connectDB();
  await bootstrapStudio();
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();
