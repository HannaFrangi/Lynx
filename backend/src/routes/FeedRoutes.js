import express from 'express';
import { protectRoute } from '../middleware/middleware.js';
import { getUserFeed, getAllPosts } from '../controllers/FeedController.js';

const router = express.Router();

router.get('/getUserFeed', protectRoute, getUserFeed);
router.get('/getFeed', protectRoute, getAllPosts);
export default router;
