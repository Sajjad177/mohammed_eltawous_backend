import { StatusCodes } from 'http-status-codes';
import { generateResponse } from '../../lib/responseFormate.js';
import sendResponse from '../../lib/sendResponse.js';
import {
  changeYourPassword,
  forgotYourPassword,
  login,
  refreshAccessTokenService,
  registerUserService,
  resendOtpCodeInEmail,
  resetYourPassword,
  toggleYourTwoFactorAuthentication,
  verifyUserEmail,
  verifyYourOtp
} from './auth.service.js';
import {
  env,
  frontendUrl,
  jwtExpire,
  jwtSecret,
  refreshTokenExpiresIn,
  refreshTokenSecrete
} from '../../core/config/config.js';
import { createToken } from '../../utility/tokenGenerate.js';
import { AppError } from '../../utility/AppError.js';

export const registerUser = async (req, res) => {
  const result = await registerUserService(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Account created successfully. Please verify your email.',
    data: result
  });
};

export const loginUser = async (req, res) => {
  try {
    const result = await login(req.body);

    if (result?.message === 'Please verify your email' && result.accessToken) {
      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          accessToken: result.accessToken
        }
      });
    }

    const { accessToken, user } = result;

    return res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      data: {
        accessToken,
        user
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      code: 400,
      message: error.message
    });
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

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await forgotYourPassword(email);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Password reset OTP sent to email successfully',
      data: result
    });
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, code: 400, message: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const { email } = req.user;
    const result = await verifyYourOtp(otp, email);

    return res.status(200).json({
      success: true,
      code: 200,
      message: 'OTP verified successfully',
      data: result
    });
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, code: 400, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email } = req.user;
    const result = await resetYourPassword(req.body, email);

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: result
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { email } = req.user;
    const result = await changeYourPassword(req.body, email);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: result
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const toggleTwoFactorAuthentication = async (req, res) => {
  try {
    const { email } = req.user;
    const result = await toggleYourTwoFactorAuthentication(email);

    return res.status(200).json({
      success: true,
      message: 'Two-factor authentication toggled successfully',
      data: result
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const googleCallback = async (req, res) => {
  // Step 1: safe parse state
  let redirectUrl = '';

  try {
    if (
      req.query.state &&
      typeof req.query.state === 'string' &&
      req.query.state.startsWith('{')
    ) {
      const parsedState = JSON.parse(req.query.state);
      redirectUrl = parsedState?.redirect || '';
    } else if (typeof req.query.state === 'string') {
      redirectUrl = req.query.state;
    }
  } catch (err) {
    redirectUrl = '';
  }

  // Step 2: remove leading "/"
  if (redirectUrl.startsWith('/')) {
    redirectUrl = redirectUrl.slice(1);
  }

  const user = req.user;

  if (!user) {
    throw new AppError('User not found', StatusCodes.NOT_FOUND);
  }

  const tokenPayload = {
    id: user._id,
    email: user.email,
    role: user.role
  };

  const accessToken = createToken(tokenPayload, jwtSecret, jwtExpire);

  const refreshToken = createToken(
    tokenPayload,
    refreshTokenSecrete,
    refreshTokenExpiresIn
  );

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: env === 'production',
    sameSite: env === 'production' ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: env === 'production',
    sameSite: env === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  // Step 3: safe redirect
  const finalRedirect = redirectUrl
    ? `${frontendUrl}/${redirectUrl}`
    : frontendUrl;

  res.redirect(finalRedirect);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'You have logged with Google successfully.',
    data: { accessToken }
  });
};

export const facebookCallBack = async (req, res) => {
  // Step 1: safe parse state
  let redirectUrl = '';

  try {
    if (
      req.query.state &&
      typeof req.query.state === 'string' &&
      req.query.state.startsWith('{')
    ) {
      const parsedState = JSON.parse(req.query.state);
      redirectUrl = parsedState?.redirect || '';
    } else if (typeof req.query.state === 'string') {
      redirectUrl = req.query.state;
    }
  } catch (err) {
    redirectUrl = '';
  }

  // Step 2: remove leading "/"
  if (redirectUrl.startsWith('/')) {
    redirectUrl = redirectUrl.slice(1);
  }

  const user = req.user;

  if (!user) {
    throw new AppError('User not found', StatusCodes.NOT_FOUND);
  }

  const tokenPayload = {
    id: user._id,
    email: user.email,
    role: user.role
  };

  const accessToken = createToken(tokenPayload, jwtSecret, jwtExpire);

  const refreshToken = createToken(
    tokenPayload,
    refreshTokenSecrete,
    refreshTokenExpiresIn
  );

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: env === 'production',
    sameSite: env === 'production' ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: env === 'production',
    sameSite: env === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  // Step 3: safe redirect
  const finalRedirect = redirectUrl
    ? `${frontendUrl}/${redirectUrl}`
    : frontendUrl;

  res.redirect(finalRedirect);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'You have logged with facebook is successfully.',
    data: { accessToken }
  });
};
