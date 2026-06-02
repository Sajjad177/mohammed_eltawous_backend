import subscriptionService from './subscription.service.js';
import { PRICING_PLANS } from '../../core/config/pricing.js';
import { catchAsync } from '../../utility/catchAsync.js';

export const getSubscriptionStatus = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const subscription = await subscriptionService.getSubscription(userId);

  res.status(200).json({
    success: true,
    data: {
      tier: subscription.currentTier,
      totalCredits: subscription.totalCredits,
      usedCredits: subscription.usedCredits,
      availableCredits: subscription.availableCredits,
      isActive: subscription.isActive,
      lastPurchaseAt: subscription.paymentVerifiedAt
    }
  });
});

export const getCreditHistory = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { limit = 50 } = req.query;

  const history = await subscriptionService.getCreditHistory(userId, parseInt(limit));

  res.status(200).json({
    success: true,
    data: history
  });
});

export const getAvailablePlans = catchAsync(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: PRICING_PLANS
  });
});
