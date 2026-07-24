// src/modules/usuarios/usuarios.routes.js — Gestión de usuarios (admin)
const { Router } = require('express');
const prisma = require('../../config/database');
const { verificarToken } = require('../../middlewares/auth.middleware');
const { requerirRol } = require('../../middlewares/role.middleware');

const router = Router();
router.use(verificarToken, requerirRol(['administrador']));

// Listar todos los usuarios
router.get('/', async (req, res) => {
  const { pagina = 1, limite = 20, rol } = req.query;
  const donde = rol ? { rol } : {};
  const [usuarios, total] = await Promise.all([
    prisma.usuario.findMany({
      where: donde,
      skip: (pagina - 1) * limite,
      take: parseInt(limite),
      select: { id: true, nombre: true, email: true, rol: true, activo: true, creadoEn: true },
      orderBy: { creadoEn: 'desc' },
    }),
    prisma.usuario.count({ where: donde }),
  ]);
  res.json({ usuarios, total });
});

// Cambiar rol de un usuario
router.patch('/:id/rol', async (req, res) => {
  const { rol } = req.body;
  if (!['cliente', 'administrador', 'cajero'].includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }
  const usuario = await prisma.usuario.update({
    where: { id: req.params.id },
    data: { rol },
    select: { id: true, nombre: true, email: true, rol: true },
  });
  res.json({ usuario });
});

// Activar/desactivar usuario
router.patch('/:id/estado', async (req, res) => {
  const usuario = await prisma.usuario.update({
    where: { id: req.params.id },
    data: { activo: req.body.activo },
    select: { id: true, nombre: true, activo: true },
  });
  res.json({ usuario });
});

module.exports = router;
