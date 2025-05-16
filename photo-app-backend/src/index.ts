import dotenv from 'dotenv';
import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import path from 'path';
import photoRoutes from './routes/photos';

dotenv.config(); // tölti a .env változókat

const app = express();
const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => {
    console.log('✅ MongoDB kapcsolódva (Atlas)');
    app.listen(PORT, () => {
      console.log(`🚀 Backend fut: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB kapcsolódási hiba:', err);
    process.exit(1);
  });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/photos', photoRoutes);
