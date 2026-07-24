// src/modules/configuracion/configuracion.routes.js
// src/modules/facturacion/facturacion.routes.js
// Archivos de rutas restantes

// ---- CONFIGURACION ----
const { Router: RouterConf } = require('express');
const prisma = require('../../config/database');
const { verificarToken } = require('../../middlewares/auth.middleware');
const { requerirRol } = require('../../middlewares/role.middleware');

const routerConf = RouterConf();

// Público: obtener configuración básica (nombre tienda, WhatsApp)
routerConf.get('/publica', async (req, res) => {
  const configs = await prisma.configuracion.findMany({
    where: {
      clave: { in: ['nombre_negocio', 'whatsapp_numero', 'whatsapp_mensaje', 'chatbot_saludo'] },
    },
  });
  const resultado = Object.fromEntries(configs.map((c) => [c.clave, c.valor]));
  res.json({ configuracion: resultado });
});

// Admin: ver y editar toda la configuración
routerConf.get('/', verificarToken, requerirRol(['administrador']), async (req, res) => {
  const configs = await prisma.configuracion.findMany({ orderBy: { clave: 'asc' } });
  res.json({ configuracion: configs });
});

routerConf.put('/:clave', verificarToken, requerirRol(['administrador']), async (req, res) => {
  const config = await prisma.configuracion.upsert({
    where: { clave: req.params.clave },
    create: { clave: req.params.clave, valor: req.body.valor },
    update: { valor: req.body.valor },
  });
  res.json({ config });
});

module.exports = routerConf;
