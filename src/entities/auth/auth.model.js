import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import { salt } from '../../core/config/config.js';

const userModel = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required']
    },
    email: {
      type: String,
      required: true,
      unique: [true, 'Email is required']
    },
    bio: { type: String, default: null },
    jobTitle: { type: String, default: null },
    password: {
      type: String
      // min: [8, 'Password must be at least 8 characters']
    },
    phone: {
      type: String
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    imageLink: { type: String, default: null },
    otp: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    resetPasswordOtp: { type: String, default: null },
    resetPasswordOtpExpires: { type: Date, default: null },
    toFactorAuth: {
      type: Boolean,
      default: false
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isDelete: {
      type: Boolean,
      default: false
    },
    address: {
      type: String,
      default: null
    }
  },
  { timestamps: true, versionKey: false }
);

userModel.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  if (!this.password) {
    return next(new Error('Password is required'));
  }

  const saltRounds = Number(salt) || 10;
  if (!saltRounds) {
    return next(new Error('Bcrypt salt rounds not configured'));
  }

  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

userModel.post('save', function (doc, next) {
  doc.password = '';
  next();
});

const User = mongoose.models.User || mongoose.model('User', userModel);
export default User;
