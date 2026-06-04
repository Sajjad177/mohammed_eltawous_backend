import express from 'express';
import {
  getAllMailSendController,
  mailSendController
} from './mailSend.controller.js';
import auth from '../../core/middlewares/authMiddleware.js';
import { USER_ROLE } from '../user/user.constant.js';

const router = express.Router();

router.post('/', auth(USER_ROLE.user), mailSendController);
router.get('/all', auth(USER_ROLE.admin), getAllMailSendController);

const mailSendRoutes = router;
export default mailSendRoutes;
