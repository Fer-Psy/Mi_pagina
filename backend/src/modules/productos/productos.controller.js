// ============================================================
// src/modules/productos/productos.controller.js
// src/modules/productos/productos.routes.js
// ============================================================

// --- CONTROLLER ---
const productosService = require('./productos.service');

async function listar(req, res) {
  const resultado = await productosService.listarProductos(req.query);
  res.json(resultado);
}

async function obtener(req, res) {
  const producto = await productosService.obtenerProducto(req.params.id);
  res.json({ producto });
}

async function crear(req, res) {
  const producto = await productosService.crearProducto(req.body);
  res.status(201).json({ mensaje: 'Producto creado exitosamente', producto });
}

async function actualizar(req, res) {
  const producto = await productosService.actualizarProducto(req.params.id, req.body);
  res.json({ mensaje: 'Producto actualizado', producto });
}

async function eliminar(req, res) {
  await productosService.eliminarProducto(req.params.id);
  res.json({ mensaje: 'Producto desactivado correctamente' });
}

async function subirImagen(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió ninguna imagen', codigo: 'IMAGEN_REQUERIDA' });
  }
  const imagen = await productosService.agregarImagen(req.params.id, {
    url: req.file.path,
    publicId: req.file.filename,
    esPrincipal: req.body.esPrincipal === 'true',
    orden: parseInt(req.body.orden || 0),
  });
  res.status(201).json({ mensaje: 'Imagen subida exitosamente', imagen });
}

module.exports = { listar, obtener, crear, actualizar, eliminar, subirImagen };
