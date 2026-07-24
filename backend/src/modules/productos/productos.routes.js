// ============================================================
// src/modules/productos/productos.routes.js — Rutas del catálogo
// ============================================================
const { Router } = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const env = require('../../config/env');
const { verificarToken } = require('../../middlewares/auth.middleware');
const { requerirRol } = require('../../middlewares/role.middleware');
const productosController = require('./productos.controller');

const router = Router();

// Configurar Cloudinary si las credenciales están disponibles
if (env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

// Multer guarda en memoria; el controller sube a Cloudinary con el SDK v2
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Máx 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Helper exportado para que el controller pueda subir a Cloudinary v2
router.cloudinaryUpload = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }] },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

// === Rutas públicas ===
router.get('/', productosController.listar);
router.get('/:id', productosController.obtener);

// === Rutas privadas — Solo administrador ===
router.post('/', verificarToken, requerirRol(['administrador']), productosController.crear);
router.patch('/:id', verificarToken, requerirRol(['administrador']), productosController.actualizar);
router.delete('/:id', verificarToken, requerirRol(['administrador']), productosController.eliminar);

router.post(
  '/:id/imagenes',
  verificarToken,
  requerirRol(['administrador']),
  upload.single('imagen'),
  productosController.subirImagen
);

module.exports = router;
