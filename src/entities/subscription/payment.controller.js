import paymentService from './payment.service.js';
import { catchAsync } from '../../utility/catchAsync.js';
import { frontendUrl } from '../../core/config/config.js';

export const initializePayment = catchAsync(async (req, res, next) => {
  const { tier } = req.body;
  const userId = req.user.userId;
  const frontendBaseUrl = (frontendUrl || 'http://localhost:3000').replace(/\/$/, '');
  const successUrl = `${frontendBaseUrl}/payment-success`;
  const cancelUrl = `${frontendBaseUrl}/payment-cancel`;

  if (!tier) {
    return res.status(400).json({
      success: false,
      message: 'tier is required'
    });
  }

  const paymentData = await paymentService.initializePayment(
    userId,
    tier,
    'AED',
    successUrl,
    cancelUrl
  );

  res.status(201).json({
    success: true,
    message: 'Checkout session created. Redirect to checkoutUrl.',
    data: paymentData
  });
});

export const getPaymentStatus = catchAsync(async (req, res, next) => {
  const { paymentId } = req.params;
  const userId = req.user.userId;

  const status = await paymentService.getPaymentStatus(paymentId, userId);

  res.status(200).json({
    success: true,
    data: status
  });
});

// Webhook endpoint for Stripe (optional - for future use)
export const handleStripeWebhook = catchAsync(async (req, res, next) => {
  // This is optional since we're using CRON polling
  // Keep for future webhook integration if needed
  res.status(200).json({ received: true });
});
