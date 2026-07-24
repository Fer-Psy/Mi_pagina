// src/modules/facturacion/facturacion.routes.js
const { Router } = require('express');
const facturacionService = require('./facturacion.service');
const { verificarToken } = require('../../middlewares/auth.middleware');
const { requerirRol } = require('../../middlewares/role.middleware');

const router = Router();
router.use(verificarToken);

// Admin: listar todas las facturas
router.get('/', requerirRol(['administrador']), async (req, res) => {
  const resultado = await facturacionService.listarFacturas(req.query);
  res.json(resultado);
});

// Admin/Cajero: emitir factura para un pedido ya pagado
router.post('/emitir/:pedidoId', requerirRol(['administrador', 'cajero']), async (req, res) => {
  const factura = await facturacionService.emitirFactura(req.params.pedidoId);
  res.json({ mensaje: 'Factura procesada', factura });
});

// Admin: consultar estado de un CDC en SIFEN
router.get('/estado/:cdc', requerirRol(['administrador']), async (req, res) => {
  const estado = await facturacionService.consultarEstado(req.params.cdc);
  res.json({ estado });
});

module.exports = router;
