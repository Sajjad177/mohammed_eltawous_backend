import express from 'express';
import {
  loginUser,
  refreshAccessToken,
  registerUser,
  verifyEmail
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

const authRoutes = router;
export default authRoutes;
