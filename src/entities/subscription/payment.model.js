import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    stripeCheckoutSessionId: {
      type: String,
      required: true,
      unique: true
    },

    tier: {
      type: String,
      enum: ['starter', 'professional', 'strategic'],
      required: true
    },

    creditsAdded: {
      type: Number,
      required: true
    },

    amount: {
      type: Number, // in cents
      required: true
    },

    currency: {
      type: String,
      default: 'AED'
    },

    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded'],
      default: 'pending'
    },

    // Cron check logs
    verificationAttempts: {
      type: Number,
      default: 0
    },

    nextCheckAt: {
      type: Date,
      default: () => new Date()
    },

    verifiedAt: {
      type: Date,
      default: null
    },

    failureReason: {
      type: String,
      default: null
    }
  },
  { timestamps: true, versionKey: false }
);

const Payment = mongoose.models.Payment || 
  mongoose.model('Payment', paymentSchema);

export default Payment;
