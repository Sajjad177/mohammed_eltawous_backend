import mongoose from 'mongoose';

const creditTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    type: {
      type: String,
      enum: ['purchase', 'usage', 'refund', 'bonus'],
      required: true
    },

    amount: {
      type: Number,
      required: true
    },

    balanceBefore: {
      type: Number,
      required: true
    },

    balanceAfter: {
      type: Number,
      required: true
    },

    description: {
      type: String
    },

    // Link to workshop (if usage)
    workshopId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    // Link to payment (if purchase)
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null
    }
  },
  { timestamps: true, versionKey: false }
);

const CreditTransaction = mongoose.models.CreditTransaction || 
  mongoose.model('CreditTransaction', creditTransactionSchema);

export default CreditTransaction;
