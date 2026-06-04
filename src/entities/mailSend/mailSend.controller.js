import { getAllMailSendService, mailSendService } from './mailSend.service.js';

export const mailSendController = async (req, res) => {
  const { email } = req.user;
  const result = await mailSendService(req.body, email);

  return res.status(200).json({
    success: true,
    message:
      'Successfully sent email. We will get back to you as soon as possible.',
    data: result
  });
};

export const getAllMailSendController = async (req, res) => {
  const result = await getAllMailSendService();

  return res.status(200).json({
    success: true,
    message: 'Successfully retrieved all mail sends.',
    data: result
  });
};
