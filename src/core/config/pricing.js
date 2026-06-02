export const PRICING_PLANS = {
  starter: {
    name: 'Starter',
    credits: 3,
    prices: {
      AED: { 
        amount: 49900, // 499 AED in cents
        currency: 'aed'
      },
      USD: { 
        amount: 13599, // ~$135.99
        currency: 'usd'
      },
      EUR: { 
        amount: 12799, // ~€127.99
        currency: 'eur'
      },
      GBP: {
        amount: 10799, // ~£107.99
        currency: 'gbp'
      }
    }
  },

  professional: {
    name: 'Professional',
    credits: 8,
    prices: {
      AED: { 
        amount: 99900, // 999 AED
        currency: 'aed'
      },
      USD: { 
        amount: 27199, // ~$271.99
        currency: 'usd'
      },
      EUR: { 
        amount: 25599, // ~€255.99
        currency: 'eur'
      },
      GBP: {
        amount: 21599, // ~£215.99
        currency: 'gbp'
      }
    }
  },

  strategic: {
    name: 'Strategic',
    credits: 15,
    prices: {
      AED: { 
        amount: 149900, // 1499 AED
        currency: 'aed'
      },
      USD: { 
        amount: 40799, // ~$407.99
        currency: 'usd'
      },
      EUR: { 
        amount: 38399, // ~€383.99
        currency: 'eur'
      },
      GBP: {
        amount: 32399, // ~£323.99
        currency: 'gbp'
      }
    }
  }
};

export const STRIPE_CONFIG = {
  maxRetries: 5, // Max verification attempts
  cronInterval: 5, // Check every 5 minutes
  paymentTimeout: 24 * 60, // 24 hours before marking as failed
};
