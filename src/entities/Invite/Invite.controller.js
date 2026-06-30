import { sendInviteLink } from './Invite.service.js';
import sendResponse from '../../lib/sendResponse.js';
import { StatusCodes } from 'http-status-codes';
import Invite from './Invite.model.js';

export const sendInvite = async (req, res) => {
  const { email } = req.user;
  const result = await sendInviteLink(req.body, email);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Invite link sent successfully.',
    data: result
  });
};

export const getInviteLink = async (req, res) => {
  const { token } = req.params;
  const invite = await Invite.findOne({ token });

  if (!invite) {
    return sendResponse(res, {
      statusCode: StatusCodes.NOT_FOUND,
      success: false,
      message: 'Invite link not found.'
    });
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Invite link retrieved successfully.',
    data: invite
  });
};
