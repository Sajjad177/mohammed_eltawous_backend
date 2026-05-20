import { StatusCodes } from 'http-status-codes';
import { generateResponse } from '../../lib/responseFormate.js';
import sendResponse from '../../lib/sendResponse.js';
import {
  loginUserService,
  refreshAccessTokenService,
  registerUserService,
  resendOtpCodeInEmail,
  verifyUserEmail
} from './auth.service.js';

export const registerUser = async (req, res) => {
  const result = await registerUserService(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Account created successfully. Please verify your email.',
    data: result
  });
};

export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const data = await loginUserService({ email, password });
    generateResponse(res, 200, true, 'Login successful', data);
  } catch (error) {
    if (error.message === 'Email and password are required') {
      generateResponse(
        res,
        400,
        false,
        'Email and password are required',
        null
      );
    } else if (error.message === 'User not found') {
      generateResponse(res, 404, false, 'User not found', null);
    } else if (error.message === 'Invalid password') {
      generateResponse(res, 400, false, 'Invalid password', null);
    } else {
      next(error);
    }
  }
};

export const refreshAccessToken = async (req, res, next) => {
  const { refreshToken } = req.body;

  try {
    const tokens = await refreshAccessTokenService(refreshToken);
    generateResponse(res, 200, true, 'Token refreshed', tokens);
  } catch (error) {
    if (error.message === 'No refresh token provided') {
      generateResponse(res, 400, false, 'No refresh token provided', null);
    } else if (error.message === 'Invalid refresh token') {
      generateResponse(res, 400, false, 'Invalid refresh token', null);
    } else {
      next(error);
    }
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email } = req.user;
    const result = await verifyUserEmail(req.body, email);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Email verified successfully',
      data: result
    });
  } catch (error) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error.message,
      data: null
    });
  }
};

export const resendOtpCode = async (req, res) => {
  try {
    const result = await resendOtpCodeInEmail(req.user);

    return res.status(200).json({
      success: true,
      message: 'OTP resent successfully',
      data: result
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
