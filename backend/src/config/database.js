const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use production MongoDB URI for Vercel deployment
    const mongoUri = process.env.VERCEL || process.env.NODE_ENV === 'production' 
      ? process.env.MONGODB_URI_PRODUCTION || process.env.MONGODB_URI
      : process.env.MONGODB_URI || 'mongodb://localhost:27017/dhansetu';
    
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
