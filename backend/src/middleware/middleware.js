import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protectRoute = async (req, res, next) => {
  try {
    // 1. Get the token from cookies
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. No token provided',
      });
    }

    // 2. Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Invalid token',
      });
    }

    // 3. Find the user
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. User not found',
      });
    }
    //4. Check if user is active
    if (!currentUser.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. User is inactive',
      });
    }
    // 5. Assign user to the request object
    req.user = currentUser;
    next();
  } catch (error) {
    console.log('Error in auth middleware:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
};
