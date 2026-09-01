import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tradenest';
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('MongoDB Connected successfully: ' + conn.connection.host + '/' + conn.connection.name);
    return true;
  } catch (error) {
    console.warn('MongoDB Local Connection Notice: ' + error.message);
    console.warn('App will proceed with in-memory / guest fallback if MongoDB is not running.');
    return false;
  }
};
