import { adminMail, emailTo } from '../../core/config/config.js';
import { getMailTemplate } from '../../lib/mailSendTamplate.js';
import sendEmail from '../../lib/sendEmail.js';
import User from '../auth/auth.model.js';
import SendMail from './mailSend.model.js';

const mailSubjects = {
  support: {
    admin: 'New Support Request',
    user: 'Support Request Received'
  },
  subscription: {
    admin: 'New Subscription Request',
    user: 'Subscription Request Received'
  }
};

export const mailSendService = async (payload, email) => {
  const { type, firstName, lastName, subject, message } = payload || {};
  const normalizedType = typeof type === 'string' ? type.toLowerCase() : '';

  if (!['support', 'subscription'].includes(normalizedType)) {
    throw new Error(
      'Invalid mail request type. Expected support or subscription.'
    );
  }

  if (!firstName || !lastName || !subject || !message) {
    throw new Error(
      'Missing required fields: firstName, lastName, subject, and message are all required.'
    );
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User not found');
  }

  const mailData = {
    userId: user._id,
    firstName,
    lastName,
    email,
    type: normalizedType,
    subject,
    message
  };

  const savedMail = await SendMail.create(mailData);

  const adminRecipient = adminMail || emailTo;
  if (!adminRecipient) {
    throw new Error(
      'Admin email is not configured. Please set ADMIN_EMAIL or EMAIL_TO.'
    );
  }

  const adminSubject = `${mailSubjects[normalizedType].admin} from ${firstName} ${lastName}`;
  const userSubject = mailSubjects[normalizedType].user;

  const adminHtml = getMailTemplate({
    ...mailData,
    recipient: 'admin'
  });
  const userHtml = getMailTemplate({
    ...mailData,
    recipient: 'user'
  });

  const [adminResult, userResult] = await Promise.all([
    sendEmail({ to: adminRecipient, subject: adminSubject, html: adminHtml }),
    sendEmail({ to: email, subject: userSubject, html: userHtml })
  ]);

  const errors = [];
  if (!adminResult.success) {
    errors.push(`admin: ${adminResult.error}`);
  }
  if (!userResult.success) {
    errors.push(`user: ${userResult.error}`);
  }

  if (errors.length) {
    throw new Error(`Email send failed: ${errors.join(' | ')}`);
  }

  return savedMail;
};
