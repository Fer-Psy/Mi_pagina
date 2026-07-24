// ============================================================
// src/modules/productos/productos.service.js — Lógica del catálogo
// ============================================================
// Gestiona todas las operaciones del catálogo de productos:
// listar con filtros, obtener detalle, CRUD para el admin.
// ============================================================

const prisma = require('../../config/database');
const { AppError } = require('../../middlewares/error.middleware');

/**
 * Lista productos con filtros y paginación.
 *
 * Recibe: { categoriaSlug, precioMin, precioMax, talla, color, busqueda, pagina, limite }
 * Devuelve: { productos, total, pagina, totalPaginas }
 */
async function listarProductos({ categoriaSlug, precioMin, precioMax, busqueda, pagina = 1, limite = 12, soloDestacados = false }) {
  // Construir el filtro dinámicamente según los parámetros recibidos
  const donde = {
    activo: true,
    ...(soloDestacados && { destacado: true }),
    ...(precioMin || precioMax
      ? {
          precioBase: {
            ...(precioMin && { gte: parseFloat(precioMin) }),
            ...(precioMax && { lte: parseFloat(precioMax) }),
          },
        }
      : {}),
    ...(busqueda && {
      OR: [
        { nombre: { contains: busqueda, mode: 'insensitive' } },
        { descripcion: { contains: busqueda, mode: 'insensitive' } },
      ],
    }),
    ...(categoriaSlug && {
      categoria: { slug: categoriaSlug },
    }),
  };

  // Calcular el "salto" de registros para paginación
  const skip = (pagina - 1) * limite;

  // Ejecutar la consulta y el conteo en paralelo para mayor velocidad
  const [productos, total] = await Promise.all([
    prisma.producto.findMany({
      where: donde,
      skip,
      take: parseInt(limite),
      orderBy: { creadoEn: 'desc' },
      include: {
        categoria: { select: { nombre: true, slug: true } },
        imagenes: {
          where: { esPrincipal: true },
          select: { url: true },
          take: 1,
        },
        variantes: {
          select: { id: true, talla: true, color: true, stock: true, precioExtra: true },
        },
      },
    }),
    prisma.producto.count({ where: donde }),
  ]);

  return {
    productos,
    total,
    pagina: parseInt(pagina),
    totalPaginas: Math.ceil(total / limite),
  };
}

/**
 * Obtiene el detalle completo de un producto, incluyendo todas sus imágenes y variantes.
 *
 * Recibe: id del producto
 * Devuelve: producto completo o lanza error 404
 */
async function obtenerProducto(id) {
  const producto = await prisma.producto.findUnique({
    where: { id },
    include: {
      categoria: true,
      imagenes: { orderBy: { orden: 'asc' } },
      variantes: { orderBy: [{ talla: 'asc' }, { color: 'asc' }] },
    },
  });

  if (!producto || !producto.activo) {
    throw new AppError('Producto no encontrado', 404, 'PRODUCTO_NO_ENCONTRADO');
  }

  return producto;
}

/**
 * Crea un nuevo producto (solo administrador).
 *
 * Recibe: datos del producto + array de variantes
 * Devuelve: producto creado
 */
async function crearProducto({ variantes, ...datos }) {
  return prisma.producto.create({
    data: {
      ...datos,
      variantes: variantes?.length ? { create: variantes } : undefined,
    },
    include: { variantes: true, imagenes: true },
  });
}

/**
 * Actualiza un producto existente.
 *
 * Recibe: id del producto + datos a actualizar
 * Devuelve: producto actualizado
 */
async function actualizarProducto(id, datos) {
  await verificarProductoExiste(id);
  return prisma.producto.update({
    where: { id },
    data: datos,
    include: { variantes: true, imagenes: true, categoria: true },
  });
}

/**
 * Desactiva un producto (no se borra de la DB para preservar historial).
 *
 * Recibe: id del producto
 */
async function eliminarProducto(id) {
  await verificarProductoExiste(id);
  await prisma.producto.update({ where: { id }, data: { activo: false } });
}

/**
 * Agrega una imagen a un producto.
 * La imagen ya fue subida a Cloudinary, aquí solo guardamos la referencia.
 */
async function agregarImagen(productoId, { url, publicId, esPrincipal, orden }) {
  await verificarProductoExiste(productoId);

  // Si la nueva imagen es principal, quitar la marca de principal a las demás
  if (esPrincipal) {
    await prisma.imagenProducto.updateMany({
      where: { productoId },
      data: { esPrincipal: false },
    });
  }

  return prisma.imagenProducto.create({
    data: { productoId, url, publicId, esPrincipal: esPrincipal || false, orden: orden || 0 },
  });
}

/** Función auxiliar para verificar que un producto existe */
async function verificarProductoExiste(id) {
  const producto = await prisma.producto.findUnique({ where: { id } });
  if (!producto) throw new AppError('Producto no encontrado', 404, 'PRODUCTO_NO_ENCONTRADO');
  return producto;
}

module.exports = { listarProductos, obtenerProducto, crearProducto, actualizarProducto, eliminarProducto, agregarImagen };
