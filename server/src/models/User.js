import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;
export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Administrator', trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin'], default: 'admin' },
    // Incremented on password change -> invalidates every issued access token.
    tokenVersion: { type: Number, default: 0 },
    failedLogins: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

UserSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, BCRYPT_ROUNDS);
};

UserSchema.methods.verifyPassword = function verifyPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

UserSchema.methods.isLocked = function isLocked() {
  return Boolean(this.lockUntil && this.lockUntil > new Date());
};

UserSchema.methods.toSafeJSON = function toSafeJSON() {
  return { id: String(this._id), name: this.name, email: this.email, role: this.role, lastLoginAt: this.lastLoginAt };
};

export const User = mongoose.models.User || mongoose.model('User', UserSchema);

/** Constant-time-ish dummy compare so unknown e-mails take as long as wrong passwords. */
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);
export const dummyCompare = (plain) => bcrypt.compare(plain, DUMMY_HASH);
