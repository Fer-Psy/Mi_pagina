// ============================================================
// src/modules/facturacion/facturacion.service.js
// ============================================================
// Servicio desacoplado de facturación electrónica e-Kuatia/SIFEN.
//
// DISEÑO: Este servicio usa el patrón "Strategy" — la lógica
// concreta de cada proveedor está en su propio archivo en /providers.
// El proveedor activo se selecciona por la variable de entorno
// FACTURACION_PROVEEDOR. Para cambiar de proveedor, solo cambias
// esa variable sin tocar código.
//
// IMPORTANTE: La emisión de factura ocurre SOLO después de que
// el pago fue confirmado al contado. Nunca antes.
// ============================================================

const prisma = require('../../config/database');
const env = require('../../config/env');
const { AppError } = require('../../middlewares/error.middleware');

/**
 * Carga el proveedor de facturación configurado en .env
 * Si el proveedor es "simulacion", usa un mock que no llama APIs reales.
 */
function obtenerProveedor() {
  const proveedor = env.FACTURACION_PROVEEDOR;
  try {
    return require(`./providers/${proveedor}.provider`);
  } catch {
    console.warn(`⚠️  Proveedor de facturación "${proveedor}" no encontrado. Usando simulación.`);
    return require('./providers/simulacion.provider');
  }
}

/**
 * Emite una factura electrónica para un pedido ya pagado.
 *
 * Recibe: pedidoId
 * Hace:
 *   1. Obtiene el pedido con sus detalles y datos del cliente
 *   2. Construye el payload según el formato del proveedor
 *   3. Envía al proveedor intermediario
 *   4. Guarda el resultado en la tabla "facturas"
 *   5. Si falla, guarda en estado "pendiente" para reintentar
 * Devuelve: registro de la factura
 */
async function emitirFactura(pedidoId) {
  // 1. Cargar el pedido completo
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      detalles: true,
      usuario: true,
      factura: true,
    },
  });

  if (!pedido) throw new AppError('Pedido no encontrado', 404, 'PEDIDO_NO_ENCONTRADO');

  // REGLA DE NEGOCIO: Solo emitir facturas de pedidos pagados
  if (pedido.estado !== 'pagado') {
    throw new AppError('Solo se pueden facturar pedidos que ya fueron pagados al contado', 400, 'PEDIDO_NO_PAGADO');
  }

  // Si ya tiene una factura aprobada, no emitir otra
  if (pedido.factura?.estado === 'aprobada') {
    return pedido.factura;
  }

  // 2. Crear o actualizar el registro de factura en estado "pendiente"
  const facturaRegistro = await prisma.factura.upsert({
    where: { pedidoId },
    create: { pedidoId, estado: 'pendiente', tipoDocumento: 'factura' },
    update: { estado: 'pendiente', intentos: { increment: 1 } },
  });

  try {
    // 3. Llamar al proveedor configurado
    const proveedor = obtenerProveedor();
    const resultado = await proveedor.emitirFactura(pedido, env);

    // 4. Actualizar el registro con el resultado exitoso
    const facturaActualizada = await prisma.factura.update({
      where: { id: facturaRegistro.id },
      data: {
        cdc: resultado.cdc,
        estado: 'aprobada',
        numeroFactura: resultado.numeroFactura,
        kudeUrl: resultado.kudeUrl,
        xmlUrl: resultado.xmlUrl,
        respuestaProveedor: resultado.respuestaCompleta,
        fechaEmision: new Date(),
        proximoIntento: null,
      },
    });

    console.log(`✅ Factura aprobada: ${resultado.numeroFactura} para pedido ${pedidoId}`);
    return facturaActualizada;

  } catch (error) {
    // 5. Si falla, guardar para reintentar (no bloquear al cliente)
    console.error(`❌ Error al emitir factura para pedido ${pedidoId}:`, error.message);

    await prisma.factura.update({
      where: { id: facturaRegistro.id },
      data: {
        estado: 'pendiente',
        respuestaProveedor: { error: error.message, fecha: new Date().toISOString() },
        // Reintentar en 15 minutos
        proximoIntento: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    // NO lanzamos error — la venta ya está confirmada, la factura se reintentará
    return facturaRegistro;
  }
}

/**
 * Consulta el estado de una factura en el proveedor.
 * Útil para verificar si SIFEN aprobó una factura pendiente.
 *
 * Recibe: cdc (Código de Control Digital de 44 dígitos)
 */
async function consultarEstado(cdc) {
  const proveedor = obtenerProveedor();
  return proveedor.consultarEstado(cdc, env);
}

/**
 * Lista todas las facturas con su estado (para el panel de administrador).
 */
async function listarFacturas({ pagina = 1, limite = 20, estado }) {
  const donde = estado ? { estado } : {};
  const skip = (pagina - 1) * limite;

  const [facturas, total] = await Promise.all([
    prisma.factura.findMany({
      where: donde,
      skip,
      take: parseInt(limite),
      orderBy: { creadoEn: 'desc' },
      include: {
        pedido: {
          include: { usuario: { select: { nombre: true, email: true } } },
        },
      },
    }),
    prisma.factura.count({ where: donde }),
  ]);

  return { facturas, total, pagina: parseInt(pagina), totalPaginas: Math.ceil(total / limite) };
}

module.exports = { emitirFactura, consultarEstado, listarFacturas };
