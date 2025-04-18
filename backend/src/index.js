import express from 'express';
import 'dotenv/config';
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import userRoutes from './routes/userRoutes.js';
import feedRoutes from './routes/FeedRoutes.js';
import { connectDB } from './config/db.js';

import cookieParser from 'cookie-parser';
import path from 'path';
const x = express();

const port = process.env.PORT || 3000;
const __dirname = path.resolve();

connectDB();

x.use(express.json());
x.use(cookieParser());
x.use(express.urlencoded({ extended: true }));
x.use('/api/auth', authRoutes);
x.use('/api/post', postRoutes);
x.use('/api/user', userRoutes);
x.use('/api/feed', feedRoutes);

x.listen(port, () => {
  console.log(`Server is running on port ${port} `);
});
