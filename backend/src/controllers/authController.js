import User from '../models/User.js';
import crypto from 'crypto';
//import bcrypt from "bcryptjs";
import PasswordResetToken from '../models/PasswordResetToken.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (_id, username) => {
  return jwt.sign({ id: _id, username }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

export const register = async (req, res) => {
  try {
    let { username, email, name, password, signUpMethod } = req.body;
    // console.log({ username, email, name, password, signUpMethod });
    // Trim and format inputs
    email = email.trim().toLowerCase();
    username = username.trim().toLowerCase();

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Field validation
    if (!username || !email || !password || !name) {
      console.log(username, email, password, name);
      return res.status(400).json({
        statusCode: 400,
        message: 'All fields are required',
      });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Username must be between 3 and 20 characters',
      });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Invalid email format',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Password must be at least 6 characters',
      });
    }

    // Check for duplicates
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Email is already in use',
      });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Username is already taken',
      });
    }

    // Create new user
    const newUser = await User.create({
      username,
      email,
      name,
      password,
      signUpMethod,
    });

    // Generate token with _id and username
    const token = signToken(newUser._id, newUser.username);

    res.cookie('jwt', token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    // Remove password from response
    newUser.password = undefined;

    res.status(201).json({
      statusCode: 201,
      user: newUser,
      message: 'Welcome to Lynx!',
    });
  } catch (error) {
    console.error('Error in register controller:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Server error',
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email = '', password = '' } = req.body || {};

    if (!email.trim() || !password.trim()) {
      return res.status(400).json({
        statusCode: 400,
        message: 'All fields are required',
      });
    }

    const isEmail = email.includes('@');
    const user = await User.findOne(
      isEmail
        ? { email: email.toLowerCase().trim() }
        : { username: email.toLowerCase().trim() }
    ).select('+password');

    if (!user) {
      return res.status(401).json({
        statusCode: 401,
        message: 'Inavlid Email or Password',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        statusCode: 401,
        message: 'User is not active!',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        statusCode: 401,
        message: 'Inavlid Email or Password',
      });
    }

    const token = signToken(user._id, user.username);
    res.cookie('jwt', token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    user.password = undefined;

    res.status(200).json({
      statusCode: 200,
      user,
      message: 'Logged in',
    });
  } catch (error) {
    console.error('Error in login Controller:', error);
    res.status(500).json({ statusCode: 500, message: 'Server error' });
  }
};

export const logout = async (req, res) => {
  res.clearCookie('jwt');
  res.status(200).json({ success: true, message: 'Logged out Succesfully' });
};
// placeholder for Google login
// This function will be implemented later
export const GoogleLogin = async (req, res) => {};

export const GetUserByID = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: 'User not found',
      });
    }
    res.status(200).json({
      statusCode: 200,
      user,
    });
  } catch (error) {
    console.error('Error in GetUserByID:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Server error',
    });
  }
};
