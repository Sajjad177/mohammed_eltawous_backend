import express from 'express';
import {
  changePassword,
  forgotPassword,
  loginUser,
  refreshAccessToken,
  registerUser,
  resendOtpCode,
  resetPassword,
  toggleTwoFactorAuthentication,
  verifyEmail,
  verifyOtp
} from './auth.controller.js';
import auth from '../../core/middlewares/authMiddleware.js';
import { USER_ROLE } from '../user/user.constant.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-access-token', refreshAccessToken);
router.post(
  '/verify-email',
  auth(USER_ROLE.user, USER_ROLE.admin),
  verifyEmail
);

router.post(
  '/resend-otp',
  auth(USER_ROLE.user, USER_ROLE.admin),
  resendOtpCode
);

router.post('/forgot-password', forgotPassword);

router.post('/verify-otp', auth(USER_ROLE.user, USER_ROLE.admin), verifyOtp);
router.post(
  '/reset-password',
  auth(USER_ROLE.user, USER_ROLE.admin),
  resetPassword
);

router.post(
  '/change-password',
  auth(USER_ROLE.user, USER_ROLE.admin),
  changePassword
);

router.post(
  '/toggle-auth',
  auth(USER_ROLE.user, USER_ROLE.admin),
  toggleTwoFactorAuthentication
);

const authRoutes = router;
export default authRoutes;
