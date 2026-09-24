import { env } from '../../config/env.js';
import { cloudinaryDriver } from './cloudinary.js';
import { localDriver } from './local.js';

const drivers = { cloudinary: cloudinaryDriver, local: localDriver };

/** The active storage driver (STORAGE_DRIVER env). All drivers implement upload(buffer, opts) / remove(key, type). */
export const storage = drivers[env.STORAGE_DRIVER];

/** Driver used to delete an existing file (a media item keeps the provider it was uploaded with). */
export const driverFor = (provider) => drivers[provider] || storage;
