import mongoose from 'mongoose';

const workshopAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Unique session identifier
    sessionId: {
      type: String,
      required: true,
      unique: true
    },

    // Credit info
    creditsCost: {
      type: Number,
      default: 1
    },

    creditsDeducted: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },

    lastError: {
      type: String,
      default: null
    },

    failedAt: {
      type: Date,
      default: null
    },

    // Data storage from each step
    company: mongoose.Schema.Types.Mixed,
    forces: [mongoose.Schema.Types.Mixed],
    guestAdd: [
      {
        inviteId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Invite'
        },
        forces: [String],
        addedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    classification: mongoose.Schema.Types.Mixed,
    axes: mongoose.Schema.Types.Mixed,
    scenarios: mongoose.Schema.Types.Mixed,
    windTunnelResults: mongoose.Schema.Types.Mixed,
    report: mongoose.Schema.Types.Mixed,
    pdfUrl: {
      type: String,
      default: null
    },
    pdfFileName: {
      type: String,
      default: null
    },
    pdfGeneratedAt: {
      type: Date,
      default: null
    },

    // Timestamps
    startedAt: {
      type: Date,
      default: Date.now
    },

    completedAt: {
      type: Date,
      default: null
    },

    lastActivityAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true, versionKey: false }
);

const WorkshopAnalysis =
  mongoose.models.WorkshopAnalysis ||
  mongoose.model('WorkshopAnalysis', workshopAnalysisSchema);

export default WorkshopAnalysis;
