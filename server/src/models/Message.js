import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['unread', 'read', 'archived'], default: 'unread', index: true },
    // HMAC of the sender IP (for abuse investigation) – raw IPs are never stored.
    ipHash: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_d, ret) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.ipHash;
        return ret;
      },
    },
  },
);

MessageSchema.index({ createdAt: -1 });

export const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);
