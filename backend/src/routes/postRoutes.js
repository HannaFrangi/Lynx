import express from 'express';
import multer from 'multer';
import {
  getPostById,
  createPost,
  editPost,
  deletePost,
  likePost,
  replyToPost,
  editReply,
  deleteReply,
  trackPostView,
} from '../controllers/postController.js';
import { protectRoute } from '../middleware/middleware.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit (you can adjust this as needed)
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm|mkv/; // Allowed extensions for images, gifs, and videos
    const mimeType = allowedTypes.test(file.mimetype);

    if (!mimeType) {
      return cb(
        new Error('Only image, gif, or video files are allowed!'),
        false
      );
    }
    cb(null, true);
  },
});

router.get('/getPost/:postId', protectRoute, getPostById);
router.post('/createPost', protectRoute, upload.single('postFile'), createPost);
router.put(
  '/editPost/:postId',
  protectRoute,
  upload.single('postFile'),
  editPost
);
router.delete('/deletePost/:postId', protectRoute, deletePost);
router.put('/likePost/:postId', protectRoute, likePost);
router.post('/getPost/view/:postId/', protectRoute, trackPostView);
router.post('/reply/:postId', protectRoute, replyToPost);
router.put('/reply/edit/:replyId', protectRoute, editReply);
router.delete('/reply/delete/:replyId', protectRoute, deleteReply);

export default router;
