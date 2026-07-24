// ============================================================
// src/modules/pedidos/pedidos.routes.js
// ============================================================
const { Router } = require('express');
const { verificarToken } = require('../../middlewares/auth.middleware');
const { requerirRol } = require('../../middlewares/role.middleware');
const pedidosController = require('./pedidos.controller');

const router = Router();

// Cliente crea pedido desde su carrito (checkout online)
router.post('/', verificarToken, requerirRol(['cliente']), pedidosController.crearPedido);

// Cajero registra venta presencial (POS)
router.post('/venta-presencial', verificarToken, requerirRol(['administrador', 'cajero']), pedidosController.crearVenta);

// Listar pedidos (cliente ve los suyos, admin ve todos)
router.get('/', verificarToken, requerirRol(['cliente', 'administrador', 'cajero']), pedidosController.listar);

// Admin: cambiar el estado de un pedido (enviado, entregado, cancelado...)
router.patch('/:id/estado', verificarToken, requerirRol(['administrador']), pedidosController.actualizarEstado);

module.exports = router;

