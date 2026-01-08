import express from "express";
import "dotenv/config";
import mongoose from "mongoose";
import multer from "multer";
import cors from "cors";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, "public")));

// Modelo Pet
const petSchema = new mongoose.Schema({
  nombre: String,
  raza: String,
  edad: String,
  genero: String,
  descripcion: String,
  imageId: mongoose.Schema.Types.ObjectId
});

const Pet = mongoose.model("Pet", petSchema);

// Modelo User
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model("User", userSchema);
const JWT_SECRET = process.env.JWT_SECRET || "secreto_dev_temporal";

// Configuración de Multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Función para iniciar servidor
async function startServer() {
  try {
    const MONGO_URI = process.env.MONGODB_URI;
    if (!MONGO_URI) {
      console.error("Falta MONGODB_URI en variables de entorno");
      process.exit(1);
    }
    const conn = await mongoose.connect(MONGO_URI);
    console.log("MongoDB conectado");

    const gfs = new mongoose.mongo.GridFSBucket(conn.connection.db, { bucketName: "uploads" });
    console.log("GridFS listo");

    // --- RUTAS DE AUTENTICACIÓN ---

    // Registro
    app.post("/api/register", async (req, res) => {
      try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: "Faltan datos" });

        const existing = await User.findOne({ username });
        if (existing) return res.status(400).json({ error: "El usuario ya existe" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.json({ ok: true, message: "Usuario creado" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al registrar" });
      }
    });

    // Login
    app.post("/api/login", async (req, res) => {
      try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: "Usuario no encontrado" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: "Contraseña incorrecta" });

        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: "1h" });
        res.json({ ok: true, token, username: user.username });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al iniciar sesión" });
      }
    });

    // --- FIN RUTAS AUTH ---

    // Subir mascota
    app.post("/api/pets", upload.single("image"), async (req, res) => {
      try {
        if (!req.file) return res.status(400).json({ error: "No se envió imagen" });

        const uploadStream = gfs.openUploadStream(req.file.originalname, { contentType: req.file.mimetype });
        uploadStream.end(req.file.buffer);

        uploadStream.on("finish", async () => {
          try {
            const nuevaMascota = new Pet({
              nombre: req.body.nombre,
              raza: req.body.raza,
              edad: req.body.edad,
              genero: req.body.genero,
              descripcion: req.body.descripcion,
              imageId: uploadStream.id // ahora ya es ObjectId correcto
            });

            await nuevaMascota.save();
            res.json({ ok: true, pet: nuevaMascota });
          } catch (err) {
            console.error("Error al guardar mascota en DB:", err);
            res.status(500).json({ error: "Error al guardar mascota en DB" });
          }
        });

        uploadStream.on("error", (err) => {
          console.error("Error al subir imagen a GridFS:", err);
          res.status(500).json({ error: "Error al subir imagen" });
        });

      } catch (err) {
        console.error("Error inesperado:", err);
        res.status(500).json({ error: "Error inesperado" });
      }
    });

    // Obtener imagen
    app.get("/api/image/:id", async (req, res) => {
      try {
        const id = new mongoose.Types.ObjectId(req.params.id);
        const downloadStream = gfs.openDownloadStream(id);
        downloadStream.on("error", () => res.status(404).json({ error: "Imagen no encontrada" }));
        downloadStream.pipe(res);
      } catch {
        res.status(500).json({ error: "ID inválido" });
      }
    });

    // Lista mascotas
    app.get("/api/pets", async (req, res) => {
      const pets = await Pet.find();
      res.json(pets);
    });

    // Eliminar mascota
    app.delete("/api/pets/:id", async (req, res) => {
      try {
        const pet = await Pet.findById(req.params.id);
        if (!pet) return res.status(404).json({ error: "No encontrado" });

        await gfs.delete(pet.imageId);
        await Pet.findByIdAndDelete(req.params.id);
        res.json({ ok: true });
      } catch (err) {
        console.error("Error al eliminar mascota:", err);
        res.status(500).json({ error: "Error al eliminar mascota" });
      }
    });

    // Editar mascota
    app.put("/api/pets/:id", async (req, res) => {
      try {
        const updated = await Pet.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
      } catch (err) {
        console.error("Error al actualizar mascota:", err);
        res.status(500).json({ error: "Error al actualizar mascota" });
      }
    });

    // Catch-all frontend
    app.use((req, res, next) => {
      if (!req.path.startsWith("/api")) {
        res.sendFile(path.join(__dirname, "public", "index.html"));
      } else {
        next();
      }
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server OK en puerto ${PORT}`));
  } catch (err) {
    console.error("Error al conectar MongoDB:", err);
  }
}

startServer();
