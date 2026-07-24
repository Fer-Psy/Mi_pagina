// ============================================================
// src/modules/pedidos/pedidos.service.js — Lógica de pedidos
// ============================================================
// REGLA DE NEGOCIO CENTRAL: Solo al contado.
// Un pedido pasa a estado "pagado" ÚNICAMENTE cuando el monto
// total fue cubierto en el momento. No hay crédito ni cuotas.
// ============================================================

const prisma = require('../../config/database');
const { AppError } = require('../../middlewares/error.middleware');

/**
 * Crea un pedido a partir del carrito del cliente.
 *
 * REGLA DE NEGOCIO CRÍTICA:
 * - Verifica que haya suficiente stock ANTES de confirmar el pedido
 * - El estado inicial siempre es "pendiente"
 * - Solo pasa a "pagado" cuando se confirma el pago al contado
 * - Descuenta el stock SOLO cuando el pago es confirmado
 *
 * Recibe: { usuarioId, direccionId, metodoPago, notas }
 * Devuelve: pedido creado
 */
async function crearPedidoDesdeCarrito({ usuarioId, direccionId, metodoPago, notas }) {
  // 1. Obtener el carrito del cliente con todos sus ítems
  const carrito = await prisma.carrito.findUnique({
    where: { usuarioId },
    include: {
      items: {
        include: {
          variante: {
            include: { producto: true },
          },
        },
      },
    },
  });

  if (!carrito || carrito.items.length === 0) {
    throw new AppError('El carrito está vacío', 400, 'CARRITO_VACIO');
  }

  // 2. Verificar stock de cada ítem ANTES de crear el pedido
  // Si algún ítem no tiene suficiente stock, lanzamos error con detalles
  const erroresStock = [];
  for (const item of carrito.items) {
    if (item.variante.stock < item.cantidad) {
      erroresStock.push({
        producto: item.variante.producto.nombre,
        talla: item.variante.talla,
        color: item.variante.color,
        stockDisponible: item.variante.stock,
        cantidadSolicitada: item.cantidad,
      });
    }
  }

  if (erroresStock.length > 0) {
    throw new AppError('Stock insuficiente para algunos productos', 400, 'STOCK_INSUFICIENTE');
  }

  // 3. Calcular totales
  let subtotal = 0;
  const detalles = carrito.items.map((item) => {
    const precioUnitario = Number(item.variante.producto.precioConDescuento || item.variante.producto.precioBase) + Number(item.variante.precioExtra);
    const subtotalItem = precioUnitario * item.cantidad;
    subtotal += subtotalItem;

    return {
      varianteId: item.varianteId,
      nombreProducto: item.variante.producto.nombre,
      talla: item.variante.talla,
      color: item.variante.color,
      cantidad: item.cantidad,
      precioUnitario,
      subtotal: subtotalItem,
    };
  });

  const total = subtotal; // Por ahora sin costos de envío adicionales

  // 4. Crear el pedido con sus detalles en una TRANSACCIÓN
  // Una transacción garantiza que todo pase o nada pase.
  // Si falla a mitad, se revierten todos los cambios.
  const pedido = await prisma.$transaction(async (tx) => {
    // Crear el pedido
    const nuevoPedido = await tx.pedido.create({
      data: {
        usuarioId,
        direccionId: direccionId || null,
        estado: 'pendiente',
        tipoVenta: 'online',
        metodoPago,
        subtotal,
        total,
        notas: notas || null,
        detalles: { create: detalles },
      },
      include: { detalles: true },
    });

    // Descontar stock inmediatamente al confirmar
    for (const item of carrito.items) {
      await tx.varianteProducto.update({
        where: { id: item.varianteId },
        data: { stock: { decrement: item.cantidad } },
      });
    }

    // Vaciar el carrito
    await tx.carritoItem.deleteMany({ where: { carritoId: carrito.id } });

    return nuevoPedido;
  });

  // 5. Marcar como pagado (al contado = pago en el momento)
  return confirmarPago(pedido.id);
}

/**
 * Registra una venta presencial desde el POS del cajero.
 *
 * Recibe: { cajeroId, items: [{varianteId, cantidad}], metodoPago, clienteNombre, notas }
 * Devuelve: pedido creado y marcado como pagado
 */
async function crearVentaPresencial({ cajeroId, usuarioId, items, metodoPago, notas }) {
  // Verificar stock y construir detalles
  const variantes = await prisma.varianteProducto.findMany({
    where: { id: { in: items.map((i) => i.varianteId) } },
    include: { producto: true },
  });

  let subtotal = 0;
  const detalles = [];

  for (const item of items) {
    const variante = variantes.find((v) => v.id === item.varianteId);
    if (!variante) throw new AppError(`Variante no encontrada: ${item.varianteId}`, 404, 'VARIANTE_NO_ENCONTRADA');
    if (variante.stock < item.cantidad) throw new AppError(`Stock insuficiente para: ${variante.producto.nombre}`, 400, 'STOCK_INSUFICIENTE');

    const precioUnitario = Number(variante.producto.precioConDescuento || variante.producto.precioBase) + Number(variante.precioExtra);
    const subtotalItem = precioUnitario * item.cantidad;
    subtotal += subtotalItem;

    detalles.push({
      varianteId: item.varianteId,
      nombreProducto: variante.producto.nombre,
      talla: variante.talla,
      color: variante.color,
      cantidad: item.cantidad,
      precioUnitario,
      subtotal: subtotalItem,
    });
  }

  const pedido = await prisma.$transaction(async (tx) => {
    const nuevoPedido = await tx.pedido.create({
      data: {
        usuarioId: usuarioId || cajeroId,
        cajeroId,
        estado: 'pagado', // Venta presencial = pagado al contado en el acto
        tipoVenta: 'presencial',
        metodoPago,
        subtotal,
        total: subtotal,
        notas: notas || null,
        detalles: { create: detalles },
      },
      include: { detalles: true },
    });

    // Descontar stock
    for (const item of items) {
      await tx.varianteProducto.update({
        where: { id: item.varianteId },
        data: { stock: { decrement: item.cantidad } },
      });
    }

    return nuevoPedido;
  });

  return pedido;
}

/**
 * Marca un pedido como pagado. Solo se llama cuando el pago es confirmado al contado.
 *
 * REGLA DE NEGOCIO: No existe "pagar después". Si el pago no es al contado, no se confirma el pedido.
 */
async function confirmarPago(pedidoId) {
  return prisma.pedido.update({
    where: { id: pedidoId },
    data: { estado: 'pagado' },
    include: { detalles: true, usuario: { select: { email: true, nombre: true } } },
  });
}

/**
 * Lista los pedidos de un usuario (cliente) o todos (administrador).
 */
async function listarPedidos({ usuarioId, rol, pagina = 1, limite = 10, estado }) {
  const donde = {
    ...(rol === 'cliente' && { usuarioId }),
    ...(estado && { estado }),
  };

  const skip = (pagina - 1) * limite;
  const [pedidos, total] = await Promise.all([
    prisma.pedido.findMany({
      where: donde,
      skip,
      take: parseInt(limite),
      orderBy: { creadoEn: 'desc' },
      include: {
        detalles: true,
        factura: { select: { estado: true, kudeUrl: true, cdc: true } },
      },
    }),
    prisma.pedido.count({ where: donde }),
  ]);

  return { pedidos, total, pagina: parseInt(pagina), totalPaginas: Math.ceil(total / limite) };
}

/**
 * Actualiza el estado de un pedido (solo administrador).
 *
 * Transiciones permitidas:
 *   pendiente → pagado | cancelado
 *   pagado    → enviado | cancelado
 *   enviado   → entregado | cancelado
 *   entregado → (ninguna — estado final)
 *   cancelado → (ninguna — estado final)
 *
 * Recibe: pedidoId, nuevoEstado
 * Devuelve: pedido actualizado
 */
async function actualizarEstadoPedido(pedidoId, nuevoEstado) {
  const TRANSICIONES_VALIDAS = {
    pendiente: ['pagado', 'cancelado'],
    pagado:    ['enviado', 'cancelado'],
    enviado:   ['entregado', 'cancelado'],
    entregado: [],
    cancelado: [],
  };

  const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
  if (!pedido) throw new AppError('Pedido no encontrado', 404, 'PEDIDO_NO_ENCONTRADO');

  const transicionesPermitidas = TRANSICIONES_VALIDAS[pedido.estado] || [];
  if (!transicionesPermitidas.includes(nuevoEstado)) {
    throw new AppError(
      `No se puede cambiar de "${pedido.estado}" a "${nuevoEstado}"`,
      400,
      'TRANSICION_INVALIDA'
    );
  }

  return prisma.pedido.update({
    where: { id: pedidoId },
    data: { estado: nuevoEstado },
    include: {
      detalles: true,
      usuario: { select: { email: true, nombre: true } },
      factura: { select: { estado: true, kudeUrl: true } },
    },
  });
}

module.exports = { crearPedidoDesdeCarrito, crearVentaPresencial, confirmarPago, listarPedidos, actualizarEstadoPedido };
