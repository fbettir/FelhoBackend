import express, {
  Request,
  Response,
  RequestHandler,
} from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Photo } from "../models/Photo";
import { checkJwt } from "../middleware/auth"; 

import { containerClient } from '../services/blob';

const router = express.Router();
const uploadDir = path.join(__dirname, "..", "..", "uploads");

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

// GET /api/photos – listázás (Auth0 protected)
router.get('/', checkJwt, (async (_req, res) => {
  try {
    const blobItems = containerClient.listBlobsFlat();
    const photos: any[] = [];

    for await (const blob of blobItems) {
      photos.push({
        name: blob.name,
        uploadDate: blob.properties.createdOn || new Date(), // fallback
        url: containerClient.getBlockBlobClient(blob.name).url,
      });
    }

    res.json(photos);
  } catch (err) {
    console.error('❌ Hiba a listázás során:', err);
    res.status(500).json({ message: 'Nem sikerült lekérni a fájlokat.' });
  }
}) as RequestHandler);



router.post(
  '/',
  upload.single('file'),
  (async (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ message: 'Hiányzik a fájl.' });

    const original = path.parse(req.file.originalname);
    const blobName = `${original.name}-${Date.now()}${original.ext}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(req.file.buffer, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype },
    });

    res.status(201).json({
      message: 'Feltöltés sikeres',
      url: blockBlobClient.url,
      name: req.body.name,
      uploadDate: new Date(),
    });
  }) as RequestHandler
);


router.delete('/:blobName', checkJwt, (async (req, res) => {
  try {
    const blobName = req.params.blobName;
    const blobClient = containerClient.getBlockBlobClient(blobName);

    const exists = await blobClient.exists();
    if (!exists) {
      return res.status(404).json({ message: 'A fájl nem található.' });
    }

    await blobClient.delete();
    res.json({ message: 'Fájl törölve az Azure Blob Storage-ből.' });
  } catch (err) {
    console.error('❌ Törlési hiba:', err);
    res.status(500).json({ message: 'Nem sikerült törölni a fájlt.' });
  }
}) as RequestHandler);



export default router;
