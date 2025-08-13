const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (process.env.SKIP_DB === 'true') {
      console.log('⚠️  SKIP_DB=true set, skipping MongoDB connection (NOT for production)');
      return;
    }

    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URI_PRODUCTION || 'mongodb://localhost:27017/dhansetu';

    if (!mongoUri) {
      console.warn('⚠️  No MongoDB URI found in environment variables. Set MONGODB_URI for production.');
    }

    const conn = await mongoose.connect(mongoUri);

    console.log(`🗄️  MongoDB Connected: ${conn.connection.host}`);
    
    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('🛑 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during MongoDB disconnection:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
