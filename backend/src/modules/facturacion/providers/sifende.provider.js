// ============================================================
// src/modules/facturacion/providers/sifende.provider.js
// ============================================================
// Proveedor para Sifende (https://sifende.com.py)
// Un intermediario homologado con SIFEN que ofrece API REST/JSON.
//
// Para activar: FACTURACION_PROVEEDOR=sifende en el .env
// Credenciales necesarias (las provee Sifende al contratar):
// - FACTURACION_API_URL
// - FACTURACION_API_KEY
// - FACTURACION_RUC
// - FACTURACION_TIMBRADO
// - FACTURACION_PUNTO_EXPEDICION_ONLINE
// ============================================================

/**
 * Emite una factura electrónica a través de la API de Sifende.
 *
 * @param {object} pedido - El pedido con sus detalles y usuario
 * @param {object} env - Variables de entorno del .env
 * @returns {object} Resultado con CDC, número de factura y URLs del KUDE/XML
 */
async function emitirFactura(pedido, env) {
  // Construir el payload según el formato de Sifende
  // NOTA: Este formato es ilustrativo. Consultar la documentación
  // oficial de Sifende para el formato exacto de su API.
  const payload = {
    tipoDocumento: 1, // 1 = Factura Electrónica
    establecimiento: env.FACTURACION_PUNTO_EXPEDICION_ONLINE,
    punto: '001',
    numero: null, // Sifende asigna el número automáticamente
    descripcion: `Venta #${pedido.id.slice(0, 8)}`,
    tipoEmision: 1, // 1 = Normal
    tipoTransaccion: 1, // 1 = Venta de mercadería

    // Datos del cliente
    cliente: {
      contribuyente: !!pedido.usuario.rucCi?.includes('-'),
      ruc: pedido.usuario.rucCi || null,
      razonSocial: pedido.usuario.razonSocial || pedido.usuario.nombre,
      email: pedido.usuario.email,
      telefono: pedido.usuario.telefono || null,
    },

    // Ítems de la factura
    items: pedido.detalles.map((detalle) => ({
      codigo: detalle.varianteId,
      descripcion: [detalle.nombreProducto, detalle.talla, detalle.color].filter(Boolean).join(' - '),
      cantidad: detalle.cantidad,
      precioUnitario: Number(detalle.precioUnitario),
      subtotal: Number(detalle.subtotal),
      iva: 10, // Por ahora todos al 10%, en el futuro usar tasaIva del producto
    })),

    // Totales
    totalBruto: Number(pedido.subtotal),
    totalNeto: Number(pedido.total),
    totalIva: Number(pedido.total) * 10 / 110, // IVA incluido en el precio (método de cálculo DNIT)

    condicion: {
      tipo: 1, // 1 = Contado
      entregas: [
        {
          tipo: mapearMetodoPago(pedido.metodoPago),
          monto: Number(pedido.total),
        },
      ],
    },
  };

  // Llamar a la API de Sifende
  const respuesta = await fetch(`${env.FACTURACION_API_URL}/documentos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.FACTURACION_API_KEY}`,
      'X-RUC': env.FACTURACION_RUC,
    },
    body: JSON.stringify(payload),
  });

  if (!respuesta.ok) {
    const errorData = await respuesta.json().catch(() => ({ message: respuesta.statusText }));
    throw new Error(`Sifende API error ${respuesta.status}: ${JSON.stringify(errorData)}`);
  }

  const data = await respuesta.json();

  return {
    cdc: data.cdc,
    numeroFactura: data.numeroFactura,
    kudeUrl: data.kudeUrl,
    xmlUrl: data.xmlUrl,
    respuestaCompleta: data,
  };
}

/**
 * Consulta el estado de un documento en Sifende.
 */
async function consultarEstado(cdc, env) {
  const respuesta = await fetch(`${env.FACTURACION_API_URL}/documentos/${cdc}`, {
    headers: { 'Authorization': `Bearer ${env.FACTURACION_API_KEY}` },
  });

  if (!respuesta.ok) throw new Error(`Error consultando estado: ${respuesta.status}`);
  return respuesta.json();
}

/** Mapea el método de pago del sistema al código que usa Sifende */
function mapearMetodoPago(metodoPago) {
  const mapa = { efectivo: 1, tarjeta: 3, transferencia: 4 };
  return mapa[metodoPago] || 1;
}

module.exports = { emitirFactura, consultarEstado };
