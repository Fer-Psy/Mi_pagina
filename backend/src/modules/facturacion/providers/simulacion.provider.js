// ============================================================
// src/modules/facturacion/providers/simulacion.provider.js
// ============================================================
// Proveedor de SIMULACIÓN — Para desarrollo y pruebas.
// No llama a ninguna API real. Devuelve una respuesta simulada
// igual a la que devolvería un proveedor real (Sifende, FactPy, etc.)
//
// Para usar: FACTURACION_PROVEEDOR=simulacion en el .env
// ============================================================

const { v4: uuidv4 } = require('uuid');

/**
 * Simula la emisión de una factura electrónica.
 * Devuelve datos ficticios pero con el mismo formato que un proveedor real.
 *
 * @param {object} pedido - El pedido de Prisma con sus relaciones
 * @param {object} env - Variables de entorno
 * @returns {object} Resultado simulado de la factura
 */
async function emitirFactura(pedido, env) {
  // Simular un pequeño delay como si fuera una API real
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Generar un CDC ficticio de 44 dígitos (formato del CDC de SIFEN)
  const cdc = '01' + Date.now().toString().padStart(20, '0') + Math.random().toString().slice(2, 24);

  // Número de factura simulado (formato: timbrado-punto-número)
  const timbrado = env.FACTURACION_TIMBRADO || '12345678';
  const punto = env.FACTURACION_PUNTO_EXPEDICION_ONLINE || '001';
  const numero = String(Math.floor(Math.random() * 9999999)).padStart(7, '0');
  const numeroFactura = `${timbrado}-${punto}-${numero}`;

  console.log(`[SIMULACIÓN] Factura emitida: ${numeroFactura} | CDC: ${cdc}`);

  return {
    cdc,
    numeroFactura,
    kudeUrl: `https://simulacion.test/kude/${cdc}.pdf`,
    xmlUrl: `https://simulacion.test/xml/${cdc}.xml`,
    respuestaCompleta: {
      simulacion: true,
      mensaje: 'Factura simulada para desarrollo',
      pedidoId: pedido.id,
      total: pedido.total,
      fecha: new Date().toISOString(),
    },
  };
}

/**
 * Simula la consulta del estado de una factura.
 *
 * @param {string} cdc - Código de Control Digital
 * @returns {object} Estado simulado
 */
async function consultarEstado(cdc) {
  return {
    cdc,
    estado: 'aprobada',
    mensaje: 'Documento aprobado (simulación)',
    simulacion: true,
  };
}

module.exports = { emitirFactura, consultarEstado };
