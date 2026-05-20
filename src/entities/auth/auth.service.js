import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  jwtExpire,
  jwtSecret,
  refreshTokenExpiresIn,
  refreshTokenSecrete
} from '../../core/config/config.js';
import logger from '../../core/config/logger.js';
import verificationCodeTemplate from '../../lib/emailTemplates.js';
import sendEmail from '../../lib/sendEmail.js';
import { createToken } from '../../utility/tokenGenerate.js';
import User from './auth.model.js';

export const registerUserService = async (payload) => {
  const email = payload.email.toLowerCase();
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error('User already exists');
  }

  if (payload.password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  let result;

  if (existingUser && !existingUser.isVerified) {
    existingUser.otp = hashedOtp;
    existingUser.otpExpires = otpExpires;
    await existingUser.save();
    result = existingUser;
  } else {
    const newUser = new User({
      ...payload,
      otp: hashedOtp,
      otpExpires,
      isVerified: false
    });
    result = await newUser.save();
  }

  await sendEmail({
    to: result.email,
    subject: 'Verify your email',
    html: verificationCodeTemplate(otp)
  });

  const JwtToken = {
    userId: result._id,
    email: result.email,
    role: result.role
  };

  const accessToken = createToken(JwtToken, jwtSecret, jwtExpire);

  const refreshToken = createToken(
    JwtToken,
    refreshTokenSecrete,
    refreshTokenExpiresIn
  );

  return {
    user: {
      _id: result._id,
      name: result.name,
      email: result.email,
      role: result.role
    },
    accessToken,
    refreshToken
  };
};

export const loginUserService = async ({ email, password }) => {
  if (!email || !password) throw new Error('Email and password are required');

  const user = await User.findOne({ email }).select(
    '_id firstName lastName email role profileImage'
  );

  if (!user) throw new Error('User not found');

  const isMatch = await user.comparePassword(user._id, password);
  if (!isMatch) throw new Error('Invalid password');

  const payload = { _id: user._id, role: user.role };

  const data = {
    user,
    accessToken: user.generateAccessToken(payload)
  };

  user.refreshToken = user.generateRefreshToken(payload);
  await user.save({ validateBeforeSave: false });

  return data;
};

export const refreshAccessTokenService = async (refreshToken) => {
  if (!refreshToken) throw new Error('No refresh token provided');

  const user = await User.findOne({ refreshToken });

  if (!user) throw new Error('Invalid refresh token');

  const decoded = jwt.verify(refreshToken, refreshTokenSecrete);

  if (!decoded || decoded._id !== user._id.toString())
    throw new Error('Invalid refresh token');

  const payload = { _id: user._id, role: user.role };

  const accessToken = user.generateAccessToken(payload);
  const newRefreshToken = user.generateRefreshToken(payload);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  return {
    accessToken,
    refreshToken: newRefreshToken
  };
};

export const verifyUserEmail = async (payload, email) => {
  const { otp } = payload;
  if (!otp) throw new Error('OTP is required');

  const existingUser = await User.findOne({ email });
  if (!existingUser) throw new Error('User not found');

  if (!existingUser.otp || !existingUser.otpExpires) {
    throw new Error('OTP not requested or expired');
  }

  if (existingUser.otpExpires < new Date()) {
    throw new Error('OTP has expired');
  }

  const isOtpMatched = await bcrypt.compare(otp.toString(), existingUser.otp);
  if (!isOtpMatched) throw new Error('Invalid OTP');

  const result = await User.findOneAndUpdate(
    { email },
    {
      isVerified: true,
      $unset: { otp: '', otpExpires: '' }
    },
    { new: true }
  ).select(
    '-password -otp -otpExpires -resetPasswordOtp -resetPasswordOtpExpires'
  );

  const response = {
    success: true,
    message: 'Email verified successfully',
    data: result
  };

  // Add token only if 2FA is enabled
  if (result.toFactorAuth) {
    const JwtToken = {
      userId: result._id,
      email: result.email,
      userType: result.userType
    };

    const accessToken = createToken(JwtToken, jwtSecret, jwtExpire);

    response.accessToken = accessToken;
  }

  return response;
};
