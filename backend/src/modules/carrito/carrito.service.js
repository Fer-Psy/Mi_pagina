// ============================================================
// src/modules/carrito/carrito.service.js
// ============================================================
const prisma = require('../../config/database');
const { AppError } = require('../../middlewares/error.middleware');

async function obtenerCarrito(usuarioId) {
  let carrito = await prisma.carrito.findUnique({
    where: { usuarioId },
    include: {
      items: {
        include: {
          variante: {
            include: {
              producto: {
                include: { imagenes: { where: { esPrincipal: true }, take: 1 } },
              },
            },
          },
        },
      },
    },
  });

  if (!carrito) {
    carrito = await prisma.carrito.create({
      data: { usuarioId },
      include: { items: true },
    });
  }

  // Calcular el total del carrito
  const total = carrito.items.reduce((acc, item) => {
    const precio = Number(item.variante.producto.precioConDescuento || item.variante.producto.precioBase) + Number(item.variante.precioExtra);
    return acc + precio * item.cantidad;
  }, 0);

  return { ...carrito, total, cantidadItems: carrito.items.reduce((a, i) => a + i.cantidad, 0) };
}

async function agregarItem(usuarioId, { varianteId, cantidad }) {
  const variante = await prisma.varianteProducto.findUnique({ where: { id: varianteId } });
  if (!variante) throw new AppError('Producto no encontrado', 404, 'VARIANTE_NO_ENCONTRADA');
  if (variante.stock < cantidad) throw new AppError(`Solo hay ${variante.stock} unidades disponibles`, 400, 'STOCK_INSUFICIENTE');

  const carrito = await prisma.carrito.upsert({
    where: { usuarioId },
    create: { usuarioId },
    update: {},
  });

  // Si el ítem ya existe en el carrito, actualizar la cantidad; si no, crearlo
  const itemExistente = await prisma.carritoItem.findUnique({
    where: { carritoId_varianteId: { carritoId: carrito.id, varianteId } },
  });

  if (itemExistente) {
    const nuevaCantidad = itemExistente.cantidad + cantidad;
    if (variante.stock < nuevaCantidad) throw new AppError(`Stock insuficiente. Máximo disponible: ${variante.stock}`, 400, 'STOCK_INSUFICIENTE');

    await prisma.carritoItem.update({
      where: { id: itemExistente.id },
      data: { cantidad: nuevaCantidad },
    });
  } else {
    await prisma.carritoItem.create({
      data: { carritoId: carrito.id, varianteId, cantidad },
    });
  }

  return obtenerCarrito(usuarioId);
}

async function actualizarItem(usuarioId, varianteId, cantidad) {
  if (cantidad <= 0) return eliminarItem(usuarioId, varianteId);

  const variante = await prisma.varianteProducto.findUnique({ where: { id: varianteId } });
  if (variante.stock < cantidad) throw new AppError(`Solo hay ${variante.stock} unidades disponibles`, 400, 'STOCK_INSUFICIENTE');

  const carrito = await prisma.carrito.findUnique({ where: { usuarioId } });
  await prisma.carritoItem.update({
    where: { carritoId_varianteId: { carritoId: carrito.id, varianteId } },
    data: { cantidad },
  });

  return obtenerCarrito(usuarioId);
}

async function eliminarItem(usuarioId, varianteId) {
  const carrito = await prisma.carrito.findUnique({ where: { usuarioId } });
  await prisma.carritoItem.deleteMany({
    where: { carritoId: carrito.id, varianteId },
  });
  return obtenerCarrito(usuarioId);
}

async function vaciarCarrito(usuarioId) {
  const carrito = await prisma.carrito.findUnique({ where: { usuarioId } });
  if (carrito) await prisma.carritoItem.deleteMany({ where: { carritoId: carrito.id } });
}

module.exports = { obtenerCarrito, agregarItem, actualizarItem, eliminarItem, vaciarCarrito };
