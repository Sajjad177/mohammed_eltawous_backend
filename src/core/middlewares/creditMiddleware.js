import subscriptionService from '../../entities/subscription/subscription.service.js';

export const checkCreditsAvailable = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const requiredCredits = req.body.requiredCredits || 1;

    const subscription = await subscriptionService.getSubscription(userId);

    if (subscription.availableCredits < requiredCredits) {
      return res.status(402).json({
        success: false,
        message: 'Insufficient credits',
        currentCredits: subscription.availableCredits,
        requiredCredits,
        tier: subscription.currentTier
      });
    }

    req.subscription = subscription;
    next();

  } catch (error) {
    next(error);
  }
};

export const deductCreditsAfterSuccess = async (workshopId, userId, amount = 1) => {
  try {
    const subscription = await subscriptionService.deductCredits(userId, amount, workshopId);
    return subscription;
  } catch (error) {
    throw error;
  }
};
