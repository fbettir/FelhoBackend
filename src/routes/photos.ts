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
router.get("/", checkJwt, async (_req, res) => {
  const photos = await Photo.find().sort({ uploadDate: -1 });
  const data = photos.map((p) => ({
    id: p._id, // fontos, hogy `id` néven szerepeljen a frontendnek
    name: p.name,
    uploadDate: p.uploadDate,
    url: `http://localhost:3000/uploads/${p.filename}`,
  }));
  res.json(data);
});

// POST /api/photos – feltöltés
router.post("/", checkJwt, upload.single("file"), (async (
  req: MulterRequest,
  res: Response
) => {
  const name = req.body.name;
  if (!name || name.length < 40) {
    return res
      .status(400)
      .json({ message: "A kép neve legalább 40 karakter legyen." });
  }

  if (!req.file) {
    return res.status(400).json({ message: "Hiányzik a fájl." });
  }

  const newPhoto = new Photo({
    filename: req.file.filename,
    name,
    uploadDate: new Date(),
  });

  console.log("Feltöltött fájl:", req.file);
  console.log("Feltöltött fájl neve:", req.file.filename);
  console.log("Feltöltött fájl útvonala:", req.file.path);
  console.log("Feltöltött fájl mérete:", req.file.size);
  console.log("Feltöltött fájl típusa:", req.file.mimetype);

  await newPhoto.save();

  res.status(201).json({ message: "Feltöltés sikeres." });
}) as RequestHandler);

router.delete('/:id', checkJwt, (async (req: Request, res: Response) => {
  try {
    const photo = await Photo.findByIdAndDelete(req.params.id);

    console.log('Törlendő kép:', photo);

    if (!photo) {
      return res.status(404).json({ message: 'A kép nem található az adatbázisban.' });
    }

    const filePath = path.join(uploadDir, photo.filename);
    console.log('Törlendő fájl:', filePath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('✅ Fájl törölve a fájlrendszerből.');
    }

    res.json({ message: 'Kép és fájl sikeresen törölve.' });
  } catch (err) {
    console.error('❌ Hiba a törlés során:', err);
    res.status(500).json({ message: 'Hiba történt a törlés során.' });
  }
}) as RequestHandler);

export default router;
