import mongoose from 'mongoose';

/**
 * A refresh-token session. Only the SHA-256 hash of the refresh token is stored,
 * so a database leak does not leak usable tokens.
 */
const SessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    // Hash of the previous (rotated) token – used to detect refresh-token reuse.
    previousTokenHash: { type: String, index: true },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
    revokedAt: Date,
    lastUsedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// MongoDB removes expired sessions automatically.
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);
