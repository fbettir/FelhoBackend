import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { verifyGoogleToken } from '../middleware/auth';
import { Photo } from '../models/Photo';

const router = express.Router();
const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}-${timestamp}${ext}`);
  },
});

const upload = multer({ storage });

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// GET /api/photos – listázás
router.get('/', async (_req, res) => {
  const photos = await Photo.find().sort({ uploadDate: -1 });
  const data = photos.map(p => ({
    id: p._id,
    name: p.name,
    uploadDate: p.uploadDate,
    url: `/uploads/${p.filename}`
  }));
  res.json(data);
});

// POST /api/photos – feltöltés
router.post(
  '/',
  verifyGoogleToken,
  upload.single('file'),
  (async (req: MulterRequest, res: Response) => {
    const name = req.body.name;
    if (!name || name.length < 40) {
      return res.status(400).json({ message: 'A kép neve legalább 40 karakter legyen.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Hiányzik a fájl.' });
    }

    const newPhoto = new Photo({
      filename: req.file.filename,
      name,
      uploadDate: new Date()
    });

    await newPhoto.save();

    res.status(201).json({ message: 'Feltöltés sikeres.' });
  }) as RequestHandler
);

// DELETE /api/photos/:id – törlés
router.delete(
  '/:id',
  verifyGoogleToken,
  (async (req, res) => {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ message: 'A fájl nem található.' });
    }

    await Photo.deleteOne({ _id: photo._id });

    const filePath = path.join(uploadDir, photo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'Fájl törölve.' });
  }) as RequestHandler
);

export default router;
