import express from 'express';
import { protectRoute } from '../middleware/middleware.js';
import { getUserFeed } from '../controllers/FeedController.js';

const router = express.Router();

router.get('/getUserFeed', protectRoute, getUserFeed);
export default router;
