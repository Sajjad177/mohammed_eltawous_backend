import mongoose, { Schema } from 'mongoose';

const InviteSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    inviteEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const Invite = mongoose.models.Invite || mongoose.model('Invite', InviteSchema);
export default Invite;
