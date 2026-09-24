import mongoose from 'mongoose';

const MediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    provider: { type: String, enum: ['cloudinary', 'local'], required: true },
    // Provider-specific identifier used for deletion (Cloudinary public_id or local relative path).
    key: { type: String, required: true },
    resourceType: { type: String, enum: ['image', 'raw'], default: 'image' },
    kind: { type: String, enum: ['image', 'document'], required: true, index: true },
    mimeType: String,
    size: Number,
    width: Number,
    height: Number,
    originalName: { type: String, default: '' },
    alt: { type: String, default: '' },
    folder: { type: String, default: 'general', index: true },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_d, ret) => {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  },
);

MediaSchema.index({ createdAt: -1 });

export const Media = mongoose.models.Media || mongoose.model('Media', MediaSchema);
