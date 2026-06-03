import mongoose, { Schema } from 'mongoose';

const sendMailModel = new Schema(
  {
    userId: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    type: {
      type: String,
      enum: ['support', 'subscription'],
      required: true
    },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true }
  },
  { timestamps: true, versionKey: false }
);

const SendMail =
  mongoose.models.SendMail || mongoose.model('SendMail', sendMailModel);
export default SendMail;
