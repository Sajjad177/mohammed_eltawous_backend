import mongoose, { Schema } from 'mongoose';

const InviteSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  url: {
    type: String,
    required: true
  }
});

const Invite = mongoose.models.Invite || mongoose.model('Invite', InviteSchema);
export default Invite;
