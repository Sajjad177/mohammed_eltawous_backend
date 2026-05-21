import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  jwtExpire,
  jwtSecret,
  refreshTokenExpiresIn,
  refreshTokenSecrete,
  salt
} from '../../core/config/config.js';
// import verificationCodeTemplate from '../../lib/emailTemplates.js';
import sendEmail from '../../lib/sendEmail.js';
import { createToken } from '../../utility/tokenGenerate.js';
import User from './auth.model.js';
import { verificationCodeTemplate } from '../../lib/verificationCodeTemplate.js';
import { companyName } from '../../lib/companyName.js';

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

export const login = async (payload) => {
  const email = payload.email.trim().toLowerCase();
  const user = await User.findOne({ email }).select(
    '+password +toFactorAuth +otp +otpExpires'
  );

  // console.log(user);

  if (!user) throw new Error('User not found');
  if (!user.isActive)
    throw new Error('Your account is suspended. Please contact support.');
  if (user.isDelete === true)
    throw new Error('Your account is deleted. Please contact support.');

  if (!user.isVerified)
    throw new Error('Please verify your email address first');

  const isPasswordValid = await bcrypt.compare(payload.password, user.password);

  if (!isPasswordValid) throw new Error('Invalid password');

  const tokenPayload = {
    userId: user._id,
    email: user.email,
    userType: user.userType
  };

  const accessToken = createToken(tokenPayload, jwtSecret, jwtExpire);

  if (String(user.toFactorAuth) === 'true') {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = hashedOtp;
    user.otpExpires = otpExpires;
    await user.save();

    try {
      await sendEmail({
        to: user.email,
        subject: 'Your 2FA Verification Code',
        html: verificationCodeTemplate(otp)
      });
    } catch (err) {
      throw new Error('Could not send 2FA verification email');
    }

    return {
      message: 'Please verify your email',
      accessToken
    };
  }

  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.resetPasswordOtp;
  delete userObj.resetPasswordOtpExpires;
  delete userObj.verificationOtp;
  delete userObj.verificationOtpExpires;
  delete userObj.otp;
  delete userObj.otpExpires;

  return {
    accessToken,
    user: userObj
  };
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

export const resendOtpCodeInEmail = async ({ email }) => {
  const existingUser = await User.findOne({ email });

  if (!existingUser) throw new Error('User not found');
  if (existingUser.isVerified) {
    throw new Error('User already verified');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  const result = await User.findOneAndUpdate(
    { email },
    {
      otp: hashedOtp,
      otpExpires
    },
    { new: true }
  ).select('name email role');

  await sendEmail({
    to: existingUser.email,
    subject: 'Verify your email',
    html: verificationCodeTemplate(otp)
  });
  return result;
};

export const forgotYourPassword = async (email) => {
  if (!email) throw new Error('Email is required');

  const isExistingUser = await User.findOne({ email });
  if (!isExistingUser) throw new Error('User not found');

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  isExistingUser.resetPasswordOtp = hashedOtp;
  isExistingUser.resetPasswordOtpExpires = otpExpires;
  await isExistingUser.save();

  await sendEmail({
    to: email,
    subject: `${companyName} - Password Reset OTP`,
    html: verificationCodeTemplate(otp)
  });

  const JwtToken = {
    userId: isExistingUser._id,
    email: isExistingUser.email,
    role: isExistingUser.role
  };

  const accessToken = createToken(JwtToken, jwtSecret, jwtExpire);

  return { accessToken };
};

export const verifyYourOtp = async (otp, email) => {
  if (!otp) throw new Error('OTP are required');

  const isExistingUser = await User.findOne({ email });
  if (!isExistingUser) throw new Error('User not found');

  if (
    !isExistingUser.resetPasswordOtp ||
    !isExistingUser.resetPasswordOtpExpires
  ) {
    throw new Error('Password reset OTP not requested or has expired');
  }

  if (isExistingUser.resetPasswordOtpExpires < new Date()) {
    throw new Error('Password reset OTP has expired');
  }

  const isOtpMatched = await bcrypt.compare(
    otp.toString(),
    isExistingUser.resetPasswordOtp
  );
  if (!isOtpMatched) throw new Error('Invalid OTP ');

  isExistingUser.resetPasswordOtp = undefined;
  isExistingUser.resetPasswordOtpExpires = undefined;
  await isExistingUser.save();

  const JwtToken = {
    userId: isExistingUser._id,
    email: isExistingUser.email,
    role: isExistingUser.role
  };

  const accessToken = createToken(JwtToken, jwtSecret, jwtExpire);

  return { accessToken };
};

export const resetYourPassword = async (payload, email) => {
  if (!payload.newPassword) {
    throw new Error('Email and new password are required');
  }

  const isExistingUser = await User.findOne({ email });
  if (!isExistingUser) throw new Error('User not found');

  // --- CHECK OLD PASSWORD ---
  const isSamePassword = await bcrypt.compare(
    payload.newPassword,
    isExistingUser.password
  );
  if (isSamePassword) {
    throw new Error('New password must be different from old password');
  }

  const hashedPassword = await bcrypt.hash(payload.newPassword, Number(salt));

  const result = await User.findOneAndUpdate(
    { email },
    {
      password: hashedPassword,
      otp: undefined,
      otpExpires: undefined
    },
    { new: true }
  ).select(
    '-password -otp -otpExpires -resetPasswordOtp -resetPasswordOtpExpires'
  );

  return result;
};

export const changeYourPassword = async (payload, email) => {
  const { currentPassword, newPassword } = payload;
  if (!currentPassword || !newPassword) {
    throw new Error('Current and new passwords are required');
  }

  if (currentPassword === newPassword) {
    throw new Error('Passwords must be different');
  }

  const isExistingUser = await User.findOne({ email });
  if (!isExistingUser) throw new Error('User not found');

  const isPasswordMatched = await bcrypt.compare(
    currentPassword,
    isExistingUser.password
  );
  if (!isPasswordMatched) throw new Error('Invalid current password');

  const hashedPassword = await bcrypt.hash(newPassword, Number(salt));

  const result = await User.findOneAndUpdate(
    { email },
    {
      password: hashedPassword
    },
    { new: true }
  ).select(
    '-password -otp -otpExpires -resetPasswordOtp -resetPasswordOtpExpires'
  );
  return result;
};

export const toggleYourTwoFactorAuthentication = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error('User not found');

  user.toFactorAuth = !user.toFactorAuth;
  await user.save();

  return {
    success: true,
    message: `Two-factor authentication ${
      user.toFactorAuth ? 'enabled' : 'disabled'
    } successfully`
  };
};
