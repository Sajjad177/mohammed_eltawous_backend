import express from 'express';
import auth from '../../core/middlewares/authMiddleware.js';
import * as paymentController from './payment.controller.js';
import * as subscriptionController from './subscription.controller.js';

const router = express.Router();
const authenticate = auth();

// Payment endpoints
router.post(
  '/initialize-payment',
  authenticate,
  paymentController.initializePayment
);

router.get(
  '/payment-status/:paymentId',
  authenticate,
  paymentController.getPaymentStatus
);

// Subscription endpoints
router.get(
  '/status',
  authenticate,
  subscriptionController.getSubscriptionStatus
);

router.get(
  '/credit-history',
  authenticate,
  subscriptionController.getCreditHistory
);

router.get(
  '/plans',
  subscriptionController.getAvailablePlans
);

export default router;
