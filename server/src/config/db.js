import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryInstance = null;

export const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sitewatch';

  try {
    // Attempt connecting to the configured MongoDB instance with a 3-second timeout
    console.log(`[Database] Attempting connection to MongoDB at: ${primaryUri}`);
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('[Database] Connected to external MongoDB successfully.');
    return;
  } catch (err) {
    console.warn(`[Database] External MongoDB not reachable (${err.message}).`);
    console.log('[Database] Starting high-performance embedded MongoDB Memory Server fallback...');
    
    try {
      mongoMemoryInstance = await MongoMemoryServer.create();
      const memoryUri = mongoMemoryInstance.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[Database] Connected to Embedded MongoDB Memory Server successfully at: ${memoryUri}`);
    } catch (memErr) {
      console.error('[Database] Failed to initialize embedded MongoDB:', memErr.message);
      throw memErr;
    }
  }
};

export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongoMemoryInstance) {
      await mongoMemoryInstance.stop();
    }
    console.log('[Database] Connection closed successfully.');
  } catch (err) {
    console.error('[Database] Error closing connection:', err.message);
  }
};
