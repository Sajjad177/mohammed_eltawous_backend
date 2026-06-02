import Payment from './payment.model.js';
import Subscription from './subscription.model.js';
import User from '../auth/auth.model.js';
import stripeService from '../../lib/stripeService.js';
import subscriptionService from './subscription.service.js';
import { PRICING_PLANS, STRIPE_CONFIG } from '../../core/config/pricing.js';

class PaymentService {
  
  // Create checkout session
  async initializePayment(userId, tier, currency = 'AED', successUrl, cancelUrl) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get or create subscription
    let subscription = await Subscription.findOne({ userId });
    if (!subscription) {
      // Create Stripe customer first
      const stripeCustomer = await stripeService.createCustomer(user.email, user.name);
      subscription = await subscriptionService.createSubscription(userId, stripeCustomer.id);
    }

    // Get pricing
    const priceData = this.getPriceData(tier, currency);
    if (!priceData) {
      throw new Error('Invalid tier or currency');
    }

    // Create Stripe checkout session
    const checkoutSessionData = await stripeService.createCheckoutSession(
      subscription.stripeCustomerId,
      priceData.amount,
      priceData.currency,
      tier,
      {
        userId: userId.toString(),
        tier,
        creditsToAdd: this.getCreditsForTier(tier)
      },
      successUrl,
      cancelUrl
    );

    // Create payment record
    const payment = await Payment.create({
      userId,
      stripeCheckoutSessionId: checkoutSessionData.sessionId,
      tier,
      creditsAdded: this.getCreditsForTier(tier),
      amount: priceData.amount,
      currency: priceData.currency,
      status: 'pending',
      verificationAttempts: 0,
      nextCheckAt: new Date(Date.now() + 5 * 60 * 1000) // Check in 5 mins
    });

    return {
      paymentId: payment._id,
      checkoutUrl: checkoutSessionData.checkoutUrl,
      sessionId: checkoutSessionData.sessionId,
      amount: priceData.amount,
      currency: priceData.currency,
      creditsToAdd: this.getCreditsForTier(tier),
      tier
    };
  }

  // CRON JOB: Verify pending payments
  async verifyPendingPayments() {
    console.log('🔄 [CRON] Starting payment verification...');

    // Find payments that need verification
    const pendingPayments = await Payment.find({
      status: 'pending',
      verificationAttempts: { $lt: STRIPE_CONFIG.maxRetries },
      nextCheckAt: { $lte: new Date() }
    }).populate('userId', 'email');

    console.log(`Found ${pendingPayments.length} pending payments to verify`);

    let successCount = 0;
    let failureCount = 0;

    for (const payment of pendingPayments) {
      try {
        // Check checkout session status with Stripe
        const stripeSession = await stripeService.getCheckoutSession(
          payment.stripeCheckoutSessionId
        );

        payment.verificationAttempts += 1;

        if (stripeSession.status === 'paid') {
          // Payment succeeded!
          console.log(`✅ Checkout Session ${payment.stripeCheckoutSessionId} succeeded`);

          payment.status = 'succeeded';
          payment.verifiedAt = new Date();
          await payment.save();

          // Update subscription with credits
          await subscriptionService.updateSubscriptionAfterPayment(
            payment.userId._id,
            payment.stripeCheckoutSessionId,
            payment.tier,
            payment.creditsAdded,
            payment.amount,
            payment.currency
          );

          successCount++;

        } else if (stripeSession.status === 'unpaid') {
          // Payment failed or pending
          console.log(
            `❌ Checkout Session ${payment.stripeCheckoutSessionId} not paid yet`
          );

          // If many attempts, mark as failed
          if (payment.verificationAttempts >= STRIPE_CONFIG.maxRetries) {
            payment.status = 'failed';
            payment.failureReason = 'Payment not completed after max retries';
            payment.verifiedAt = new Date();
          } else {
            // Reschedule for later
            payment.nextCheckAt = new Date(Date.now() + 5 * 60 * 1000);
          }
          await payment.save();

        } else {
          // Still in progress
          payment.nextCheckAt = new Date(Date.now() + 5 * 60 * 1000);
          await payment.save();
        }

      } catch (error) {
        console.error(
          `Error verifying checkout session ${payment.stripeCheckoutSessionId}:`,
          error.message
        );
        payment.verificationAttempts += 1;
        payment.nextCheckAt = new Date(Date.now() + 10 * 60 * 1000);
        await payment.save();
      }
    }

    // Mark very old payments as failed
    const oldPayments = await Payment.find({
      status: 'pending',
      createdAt: {
        $lt: new Date(Date.now() - STRIPE_CONFIG.paymentTimeout * 60 * 1000)
      }
    });

    for (const oldPayment of oldPayments) {
      oldPayment.status = 'failed';
      oldPayment.failureReason = 'Payment timeout - no confirmation within 24 hours';
      await oldPayment.save();
    }

    console.log(
      `✅ Cron completed: ${successCount} succeeded, ${failureCount} failed, ${oldPayments.length} timed out`
    );

    return {
      verified: successCount,
      failed: failureCount,
      timedOut: oldPayments.length
    };
  }

  // Get payment status
  async getPaymentStatus(paymentId, userId) {
    const payment = await Payment.findOne({ _id: paymentId, userId });
    
    if (!payment) {
      throw new Error('Payment not found');
    }

    return {
      status: payment.status,
      verificationAttempts: payment.verificationAttempts,
      verifiedAt: payment.verifiedAt,
      failureReason: payment.failureReason,
      creditsAdded: payment.creditsAdded
    };
  }

  // Helper: Get price data
  getPriceData(tier, currency) {
    if (!PRICING_PLANS[tier] || !PRICING_PLANS[tier].prices[currency]) {
      return null;
    }

    return PRICING_PLANS[tier].prices[currency];
  }

  // Helper: Get credits for tier
  getCreditsForTier(tier) {
    return PRICING_PLANS[tier]?.credits || 0;
  }
}

export default new PaymentService();
