import {
  followUnfollowUser,
  getUserFollowList,
  updateProfile,
} from '../controllers/userController.js';
import express from 'express';
import { protectRoute } from '../middleware/middleware.js';
import multer from 'multer';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
});

router.put('/follow/:userIdToFollow', protectRoute, followUnfollowUser);
router.get('/:userId/followers', (req, res) =>
  getUserFollowList(
    { ...req, params: { ...req.params, type: 'followers' } },
    res
  )
);
router.get('/:userId/following', (req, res) =>
  getUserFollowList(
    { ...req, params: { ...req.params, type: 'following' } },
    res
  )
);

router.put(
  '/updateProfile',
  protectRoute,
  upload.single('profilePic'),
  updateProfile
);

export default router;
