import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://localhost:27017/photo-app'; // vagy a Mongo Atlas URL

export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB csatlakozva');
  } catch (error) {
    console.error('❌ MongoDB hiba:', error);
    process.exit(1);
  }
}
