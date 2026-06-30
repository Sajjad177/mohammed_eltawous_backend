import { Router } from 'express';
import auth from '../../core/middlewares/authMiddleware.js';
import { USER_ROLE } from '../user/user.constant.js';
import { getInviteLink, sendInvite } from './Invite.controller.js';

const router = Router();

router.post('/send', auth(USER_ROLE.user, USER_ROLE.admin), sendInvite);
router.get('/invite/:token', getInviteLink);

const InviteRouter = router;
export default InviteRouter;
