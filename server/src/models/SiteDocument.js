import mongoose from 'mongoose';

/**
 * Singleton documents (profile, settings) with a draft/published workflow.
 * The admin edits `draft`; the public website only ever reads `published`.
 * "Publish" copies draft -> published. Shape is enforced by zod (validators/singletons.js).
 */
const SiteDocumentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, enum: ['profile', 'settings'] },
    draft: { type: mongoose.Schema.Types.Mixed, default: {} },
    published: { type: mongoose.Schema.Types.Mixed, default: {} },
    publishedAt: Date,
    draftUpdatedAt: Date,
    // true while the document only holds auto-generated defaults (never edited or seeded).
    autoCreated: { type: Boolean, default: false },
  },
  { timestamps: true, minimize: false },
);

export const SiteDocument = mongoose.models.SiteDocument || mongoose.model('SiteDocument', SiteDocumentSchema);
