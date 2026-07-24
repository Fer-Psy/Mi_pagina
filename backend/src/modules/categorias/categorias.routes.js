// src/modules/categorias/categorias.routes.js
const { Router } = require('express');
const prisma = require('../../config/database');
const { verificarToken } = require('../../middlewares/auth.middleware');
const { requerirRol } = require('../../middlewares/role.middleware');

const router = Router();

// Pública: cualquiera puede ver las categorías
router.get('/', async (req, res) => {
  const categorias = await prisma.categoria.findMany({
    where: { activo: true },
    include: { _count: { select: { productos: true } } },
    orderBy: { nombre: 'asc' },
  });
  res.json({ categorias });
});

router.get('/:slug', async (req, res) => {
  const categoria = await prisma.categoria.findUnique({ where: { slug: req.params.slug } });
  if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });
  res.json({ categoria });
});

// Solo admin puede crear/editar categorías
router.post('/', verificarToken, requerirRol(['administrador']), async (req, res) => {
  const { nombre, descripcion, imagenUrl } = req.body;
  const slug = nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const categoria = await prisma.categoria.create({ data: { nombre, slug, descripcion, imagenUrl } });
  res.status(201).json({ categoria });
});

router.patch('/:id', verificarToken, requerirRol(['administrador']), async (req, res) => {
  const categoria = await prisma.categoria.update({ where: { id: req.params.id }, data: req.body });
  res.json({ categoria });
});

module.exports = router;
