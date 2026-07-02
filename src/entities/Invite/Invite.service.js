import Payment from '../subscription/payment.model.js';
import Subscription from '../subscription/subscription.model.js';
import crypto from 'crypto';
import Invite from './Invite.model.js';
import sendEmail from '../../lib/sendEmail.js';
import { InviteLinkTemplate } from '../../lib/InviteLinkTemplate.js';
import User from '../auth/auth.model.js';

export const sendInviteLink = async (payload, email) => {
  // Logged in user
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('User not found.');
  }

  // Check payment
  const isPayed = await Payment.findOne({
    userId: user._id,
    status: 'succeeded'
  });

  if (!isPayed) {
    throw new Error('Only paid users can send invite links.');
  }

  // Check subscription
  const isSubscriber = await Subscription.findOne({
    userId: user._id,
    isActive: true
  });

  if (!isSubscriber) {
    throw new Error('Only subscribers can send invite links.');
  }

  // Validate payload
  if (!payload.email) {
    throw new Error('Invite email is required.');
  }

  if (!payload.workshopAnalysisId) {
    throw new Error('Please create a scenario before inviting guests.');
  }

  if (!payload.workshopAnalysisId) {
    throw new Error('Workshop Analysis Id is required.');
  }

  // Generate secure token
  const token = crypto.randomBytes(10).toString('hex');

  // Invite Link
  const inviteLink = `${process.env.FRONTEND_URL}/invite/${token}`;

  // Check existing invite
  let invite = await Invite.findOne({
    ownerId: user._id,
    inviteEmail: payload.email,
    workshopAnalysisId: payload.workshopAnalysisId
  });

  if (invite) {
    invite.token = token;
    invite.updatedAt = new Date();

    await invite.save();
  } else {
    invite = await Invite.create({
      ownerId: user._id,
      workshopAnalysisId: payload.workshopAnalysisId,
      inviteEmail: payload.email,
      token
    });
  }

  // Send Email
  await sendEmail({
    to: payload.email,
    subject: 'Invitation Link',
    html: InviteLinkTemplate(inviteLink)
  });

  return {
    inviteId: invite._id,
    token: invite.token,
    inviteLink
  };
};
