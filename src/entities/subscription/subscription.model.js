import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },

    // Stripe info
    stripeCustomerId: {
      type: String,
      required: true,
      unique: true
    },

    // Current credits (no expiration)
    totalCredits: {
      type: Number,
      default: 0
    },
    usedCredits: {
      type: Number,
      default: 0
    },
    availableCredits: {
      type: Number,
      default: 0
    },

    // Payment tracking (latest purchase)
    lastPaymentId: {
      type: String,
      default: null
    },
    lastPaymentStatus: {
      type: String,
      enum: ['pending', 'succeeded', 'failed'],
      default: 'pending'
    },
    lastPaymentAmount: {
      type: Number, // in cents
      default: 0
    },
    lastPaymentCurrency: {
      type: String,
      default: 'AED'
    },

    // Tier info
    currentTier: {
      type: String,
      enum: ['starter', 'professional', 'strategic', 'free'],
      default: 'free'
    },

    // Status
    isActive: {
      type: Boolean,
      default: false
    },

    // Payment verification timestamps
    lastCronCheckAt: {
      type: Date,
      default: null
    },
    paymentVerifiedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true, versionKey: false }
);

const Subscription = mongoose.models.Subscription || 
  mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
