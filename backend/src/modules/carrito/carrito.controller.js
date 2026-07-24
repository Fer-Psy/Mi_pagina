// src/modules/carrito/carrito.controller.js
const carritoService = require('./carrito.service');

async function obtener(req, res) {
  const carrito = await carritoService.obtenerCarrito(req.usuario.id);
  res.json({ carrito });
}

async function agregar(req, res) {
  const { varianteId, cantidad = 1 } = req.body;
  const carrito = await carritoService.agregarItem(req.usuario.id, { varianteId, cantidad });
  res.json({ mensaje: 'Producto agregado al carrito', carrito });
}

async function actualizar(req, res) {
  const carrito = await carritoService.actualizarItem(req.usuario.id, req.params.varianteId, req.body.cantidad);
  res.json({ carrito });
}

async function eliminar(req, res) {
  const carrito = await carritoService.eliminarItem(req.usuario.id, req.params.varianteId);
  res.json({ mensaje: 'Producto eliminado del carrito', carrito });
}

async function vaciar(req, res) {
  await carritoService.vaciarCarrito(req.usuario.id);
  res.json({ mensaje: 'Carrito vaciado' });
}

module.exports = { obtener, agregar, actualizar, eliminar, vaciar };
