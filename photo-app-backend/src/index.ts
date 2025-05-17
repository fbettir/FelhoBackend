import dotenv from 'dotenv';
import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import path from 'path';
import photoRoutes from './routes/photos';
import { checkJwt } from './middleware/auth';

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

const uploadsPath = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath));

// JSON beolvasás
app.use(express.json());
app.use(cors());

// Védett API útvonalak
app.use('/api/photos', checkJwt, photoRoutes); // ✅ Csak erre kell az auth