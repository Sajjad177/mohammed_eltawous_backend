import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeSecret, { apiVersion: '2024-04-10' });

export class StripeService {
  
  // Create Stripe customer
  async createCustomer(email, name) {
    const customer = await stripe.customers.create({
      email,
      name
    });
    return customer;
  }

  // Create checkout session
  async createCheckoutSession(customerId, amount, currency, tier, metadata, successUrl, cancelUrl) {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`,
              description: `Strategic Analysis Credits`
            },
            unit_amount: amount
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: metadata
    });
    
    return {
      sessionId: session.id,
      checkoutUrl: session.url,
      status: session.payment_status
    };
  }

  // Retrieve checkout session
  async getCheckoutSession(sessionId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    return {
      id: session.id,
      status: session.payment_status, // paid, unpaid, no_payment_required
      paymentStatus: session.payment_status,
      customerId: session.customer,
      metadata: session.metadata,
      amount_total: session.amount_total,
      currency: session.currency
    };
  }

  // Retrieve payment intent from checkout session
  async getCheckoutSessionPaymentIntent(sessionId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session.payment_intent) {
      return null;
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
    
    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata
    };
  }

  // Refund payment
  async refundPayment(paymentIntentId) {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId
    });
    
    return refund;
  }
}

export default new StripeService();
