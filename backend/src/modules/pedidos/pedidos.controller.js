// ============================================================
// src/modules/pedidos/pedidos.controller.js
// ============================================================

const pedidosService = require('./pedidos.service');

async function crearPedido(req, res) {
  const pedido = await pedidosService.crearPedidoDesdeCarrito({
    usuarioId: req.usuario.id,
    ...req.body,
  });
  res.status(201).json({ mensaje: 'Pedido creado y pagado exitosamente', pedido });
}

async function crearVenta(req, res) {
  const pedido = await pedidosService.crearVentaPresencial({
    cajeroId: req.usuario.id,
    ...req.body,
  });
  res.status(201).json({ mensaje: 'Venta registrada exitosamente', pedido });
}

async function listar(req, res) {
  const resultado = await pedidosService.listarPedidos({
    usuarioId: req.usuario.id,
    rol: req.usuario.rol,
    ...req.query,
  });
  res.json(resultado);
}

/**
 * PATCH /pedidos/:id/estado — Actualiza el estado de un pedido.
 * Solo accesible para administradores.
 * Body: { estado: 'enviado' | 'entregado' | 'cancelado' | ... }
 */
async function actualizarEstado(req, res) {
  const { estado } = req.body;
  if (!estado) {
    return res.status(400).json({ error: 'El campo "estado" es requerido', codigo: 'ESTADO_REQUERIDO' });
  }
  const pedido = await pedidosService.actualizarEstadoPedido(req.params.id, estado);
  res.json({ mensaje: `Estado actualizado a "${estado}"`, pedido });
}

module.exports = { crearPedido, crearVenta, listar, actualizarEstado };

