import Subscription from './subscription.model.js';
import CreditTransaction from './creditTransaction.model.js';
import User from '../auth/auth.model.js';

class SubscriptionService {
  
  // Create subscription for new user
  async createSubscription(userId, stripeCustomerId) {
    const existingSubscription = await Subscription.findOne({ userId });
    
    if (existingSubscription) {
      return existingSubscription;
    }

    const subscription = await Subscription.create({
      userId,
      stripeCustomerId,
      totalCredits: 0,
      usedCredits: 0,
      availableCredits: 0,
      isActive: false,
      currentTier: 'free'
    });

    await User.findByIdAndUpdate(userId, { 
      subscriptionId: subscription._id 
    });

    return subscription;
  }

  // Get user subscription
  async getSubscription(userId) {
    let subscription = await Subscription.findOne({ userId });
    
    if (!subscription) {
      // Return default free subscription if not exists
      return {
        userId,
        totalCredits: 0,
        usedCredits: 0,
        availableCredits: 0,
        isActive: false,
        currentTier: 'free'
      };
    }

    return subscription;
  }

  // Update subscription after payment verified
  async updateSubscriptionAfterPayment(
    userId, 
    paymentIntentId, 
    tier, 
    creditsToAdd, 
    amount, 
    currency
  ) {
    let subscription = await Subscription.findOne({ userId });
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Update subscription
    subscription.lastPaymentId = paymentIntentId;
    subscription.lastPaymentStatus = 'succeeded';
    subscription.lastPaymentAmount = amount;
    subscription.lastPaymentCurrency = currency;
    subscription.currentTier = tier;
    subscription.totalCredits += creditsToAdd;
    subscription.availableCredits += creditsToAdd;
    subscription.isActive = true;
    subscription.paymentVerifiedAt = new Date();
    subscription.lastCronCheckAt = new Date();

    await subscription.save();

    // Log transaction
    await this.logCreditTransaction(
      userId,
      'purchase',
      creditsToAdd,
      subscription.availableCredits - creditsToAdd,
      subscription.availableCredits,
      `Purchased ${tier} tier - ${creditsToAdd} credits`
    );

    // Update user
    await User.findByIdAndUpdate(userId, {
      lastPurchaseAt: new Date()
    });

    return subscription;
  }

  // Deduct credits when user analyzes
  async deductCredits(userId, amount, workshopId) {
    const subscription = await Subscription.findOne({ userId });
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.availableCredits < amount) {
      throw new Error(
        `Insufficient credits. You have ${subscription.availableCredits} credits`
      );
    }

    subscription.availableCredits -= amount;
    subscription.usedCredits += amount;

    await subscription.save();

    // Log transaction
    await this.logCreditTransaction(
      userId,
      'usage',
      amount,
      subscription.availableCredits + amount,
      subscription.availableCredits,
      `Used for analysis`
    );

    return subscription;
  }

  // Add bonus credits (admin)
  async addBonusCredits(userId, amount, reason) {
    let subscription = await Subscription.findOne({ userId });
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    subscription.totalCredits += amount;
    subscription.availableCredits += amount;

    await subscription.save();

    // Log transaction
    await this.logCreditTransaction(
      userId,
      'bonus',
      amount,
      subscription.availableCredits - amount,
      subscription.availableCredits,
      reason || 'Bonus credits added'
    );

    return subscription;
  }

  // Log credit transaction
  async logCreditTransaction(
    userId, 
    type, 
    amount, 
    balanceBefore, 
    balanceAfter, 
    description
  ) {
    return await CreditTransaction.create({
      userId,
      type,
      amount,
      balanceBefore,
      balanceAfter,
      description
    });
  }

  // Get credit history
  async getCreditHistory(userId, limit = 50) {
    const transactions = await CreditTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return transactions;
  }

  // Check if subscription is valid
  async isSubscriptionValid(userId) {
    const subscription = await Subscription.findOne({ userId });
    
    if (!subscription) {
      return false;
    }

    return subscription.isActive && subscription.availableCredits > 0;
  }
}

export default new SubscriptionService();
