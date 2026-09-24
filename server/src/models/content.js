import mongoose from 'mongoose';

const { Schema } = mongoose;

/** Reusable image sub-document: { url, alt }. */
export const ImageSchema = new Schema({ url: { type: String, default: '' }, alt: { type: String, default: '' } }, { _id: false });

const toJSON = {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
};

/**
 * Factory for admin-managed, orderable, publishable collections.
 * Every content model gets `order`, `isPublished` and timestamps.
 */
export function defineContentModel(name, fields, { indexes = [] } = {}) {
  const schema = new Schema(
    {
      ...fields,
      order: { type: Number, default: 0, index: true },
      isPublished: { type: Boolean, default: true, index: true },
    },
    { timestamps: true, toJSON, toObject: toJSON },
  );
  indexes.forEach(([spec, opts]) => schema.index(spec, opts));
  return mongoose.models[name] || mongoose.model(name, schema);
}

const str = { type: String, default: '', trim: true };
const strArr = { type: [String], default: [] };

export const Project = defineContentModel(
  'Project',
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    shortDescription: str,
    description: str,
    thumbnail: { type: ImageSchema, default: () => ({}) },
    images: { type: [ImageSchema], default: [] },
    technologies: strArr,
    category: str,
    githubUrl: str,
    liveUrl: str,
    docsUrl: str,
    featured: { type: Boolean, default: false },
    completedAt: str,
  },
  { indexes: [[{ featured: -1, order: 1 }]] },
);

export const Skill = defineContentModel('Skill', {
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  level: { type: Number, min: 0, max: 100 },
  icon: str,
});

export const Experience = defineContentModel('Experience', {
  type: { type: String, enum: ['work', 'internship'], default: 'work', index: true },
  role: { type: String, required: true, trim: true },
  company: { type: String, required: true, trim: true },
  companyUrl: str,
  location: str,
  employmentType: str,
  startDate: str,
  endDate: str,
  current: { type: Boolean, default: false },
  description: str,
  highlights: strArr,
  technologies: strArr,
  logo: { type: ImageSchema, default: () => ({}) },
});

export const Education = defineContentModel('Education', {
  degree: { type: String, required: true, trim: true },
  field: str,
  institution: { type: String, required: true, trim: true },
  location: str,
  startDate: str,
  endDate: str,
  result: str,
  description: str,
  logo: { type: ImageSchema, default: () => ({}) },
});

export const Research = defineContentModel('Research', {
  title: { type: String, required: true, trim: true },
  type: str,
  institution: str,
  supervisor: str,
  status: str,
  date: str,
  abstract: str,
  url: str,
  technologies: strArr,
});

export const Certification = defineContentModel('Certification', {
  name: { type: String, required: true, trim: true },
  issuer: { type: String, required: true, trim: true },
  issueDate: str,
  expiryDate: str,
  credentialId: str,
  credentialUrl: str,
  image: { type: ImageSchema, default: () => ({}) },
});

export const Achievement = defineContentModel('Achievement', {
  title: { type: String, required: true, trim: true },
  organization: str,
  date: str,
  description: str,
  url: str,
});

export const Service = defineContentModel('Service', {
  title: { type: String, required: true, trim: true },
  description: str,
  icon: str,
});

export const Testimonial = defineContentModel('Testimonial', {
  name: { type: String, required: true, trim: true },
  role: str,
  company: str,
  quote: str,
  avatar: { type: ImageSchema, default: () => ({}) },
  url: str,
});

export const Post = defineContentModel('Post', {
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  excerpt: str,
  content: str,
  coverImage: { type: ImageSchema, default: () => ({}) },
  tags: strArr,
  externalUrl: str,
  publishedAt: str,
});

export const SocialLink = defineContentModel('SocialLink', {
  platform: { type: String, required: true, trim: true },
  label: str,
  url: { type: String, required: true, trim: true },
  showInHero: { type: Boolean, default: true },
});
