import mongoose from 'mongoose';
import logger from '../utils/logger';


export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanager';
    
    logger.info(`Connecting to MongoDB...`);
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    logger.info(' MongoDB connected successfully');
    
    // Connection events
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to DB');
    });
    
    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from DB');
    });
    
  } catch (error) {
    logger.error(' MongoDB connection failed');
    process.exit(1);
  }
};