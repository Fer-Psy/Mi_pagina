// src/modules/carrito/carrito.routes.js
const { Router } = require('express');
const { verificarToken } = require('../../middlewares/auth.middleware');
const carritoController = require('./carrito.controller');

const router = Router();

// Todas las rutas del carrito requieren autenticación
router.use(verificarToken);

router.get('/', carritoController.obtener);
router.post('/items', carritoController.agregar);
router.patch('/items/:varianteId', carritoController.actualizar);
router.delete('/items/:varianteId', carritoController.eliminar);
router.delete('/', carritoController.vaciar);

module.exports = router;
