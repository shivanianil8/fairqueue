import mongoose from 'mongoose';

let isMongoConnected = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fairqueue';
  try {
    // Attempt connection with short 2.5s timeout so startup is instantaneous even if MongoDB is not running
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    isMongoConnected = true;
    console.log(`[Database] MongoDB connected successfully to: ${uri}`);
  } catch (err) {
    isMongoConnected = false;
    console.warn(`[Database] MongoDB not reachable at ${uri}.`);
    console.info(`[Database] Operating in persistent In-Memory / File-backed fallback mode.`);
  }

  mongoose.connection.on('disconnected', () => {
    isMongoConnected = false;
    console.warn('[Database] MongoDB disconnected. Falling back to local storage.');
  });

  mongoose.connection.on('reconnected', () => {
    isMongoConnected = true;
    console.log('[Database] MongoDB reconnected.');
  });
}

export function getDBStatus() {
  return {
    status: isMongoConnected ? 'connected' : 'in-memory-ready',
    connected: isMongoConnected,
    mode: isMongoConnected ? 'MongoDB' : 'In-Memory / Local Store (Zero-Config Fallback)',
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fairqueue'
  };
}
