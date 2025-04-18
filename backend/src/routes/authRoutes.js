import express from 'express';
import {
  login,
  register,
  logout,
  GetUserByID,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.get('/getUserById/:id', GetUserByID);

export default router;
