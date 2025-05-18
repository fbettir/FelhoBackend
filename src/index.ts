// src/index.ts
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import path from 'path';
import photoRoutes from './routes/photos';
import { checkJwt } from './middleware/auth';

// .env változók betöltése
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB kapcsolódás
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

// JSON feldolgozás engedélyezése
app.use(express.json());

// Statikus fájlok kiszolgálása (opcionális, ha van feltöltés a /uploads mappába)
const uploadsPath = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath));

// CORS beállítás csak az engedélyezett frontendnek
const allowedOrigins = [
  'https://yellow-mushroom-0b0fe7f03.6.azurestaticapps.net' // Állítsd be a saját Static Web App URL-edre
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Egyszerű ping route (opcionális)
app.get('/ping', (_req, res) => {
  res.status(200).json({ message: '✅ Backend él' });
});

// API route Auth0 ellenőrzéssel
app.use('/api/photos', checkJwt, photoRoutes);
