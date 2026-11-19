import mongoose from 'mongoose';
import config from './index';

// One shared connection promise per running instance.
// Works on a normal long-running server and on serverless hosts (Vercel),
// where the same instance handles many requests. If a connection attempt
// fails, the cache is cleared so the next request retries.
let connectionPromise: Promise<typeof mongoose> | null = null;

export const connectDB = (): Promise<typeof mongoose> => {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose);
  }

  if (!connectionPromise) {
    if (!config.database_url) {
      return Promise.reject(new Error('DATABASE_URL is not set'));
    }

    connectionPromise = mongoose.connect(config.database_url).catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  return connectionPromise;
};
