// src/models/Photo.ts
import mongoose from 'mongoose';

const photoSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  name: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now }
});

export const Photo = mongoose.model('Photo', photoSchema);
