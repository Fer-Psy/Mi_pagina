// ============================================================
// src/modules/chatbot/chatbot.routes.js — Chatbot basado en reglas
// ============================================================
// El chatbot usa un sistema de "intenciones" (intents):
// analiza el mensaje del cliente, detecta de qué está hablando,
// y devuelve la respuesta correspondiente.
// ============================================================
const { Router } = require('express');
const prisma = require('../../config/database');

const router = Router();

// Base de conocimiento del chatbot — configurable desde el admin
const RESPUESTAS = {
  saludo: {
    patrones: ['hola', 'buenas', 'buen día', 'buenas tardes', 'buenas noches', 'hey'],
    respuesta: '¡Hola! Bienvenida a Mi Tienda Bella 💖 ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre productos, tallas, envíos o el estado de tu pedido.',
  },
  tallas: {
    patrones: ['talla', 'talle', 'medida', 'tamaño', 'size', 'qué talla', 'tabla de medidas'],
    respuesta: '📏 Nuestras tallas van de XS a XL para ropa y de 35 a 42 para calzado. Para accesorios suelen ser talla única.\n\n¿Te gustaría saber la medida específica de algún producto? Indícame cuál y con gusto te ayudo.',
  },
  envio: {
    patrones: ['envío', 'envio', 'delivery', 'entrega', 'despacho', 'llega', 'cuánto tarda', 'flete'],
    respuesta: '🚚 Hacemos envíos a todo el Paraguay!\n\n• Asunción y Gran Asunción: 1-2 días hábiles\n• Interior del país: 3-5 días hábiles\n\n¿Tienes alguna otra consulta?',
  },
  pago: {
    patrones: ['pago', 'pagar', 'precio', 'costo', 'cuánto', 'efectivo', 'tarjeta', 'transferencia'],
    respuesta: '💳 Aceptamos los siguientes métodos de pago AL CONTADO:\n\n• Efectivo\n• Transferencia bancaria\n• Tarjeta de débito/crédito (pago único)\n\nNo trabajamos con crédito ni cuotas. ¿Necesitas más información?',
  },
  pedido: {
    patrones: ['pedido', 'orden', 'compra', 'estado', 'dónde está', 'seguimiento', 'tracking'],
    respuesta: '📦 Para consultar el estado de tu pedido, ingresa a tu cuenta → Mis Pedidos, o compárteme tu número de pedido y lo verifico para ti.',
  },
  devolucion: {
    patrones: ['devolución', 'devolucion', 'cambio', 'cambiar', 'reembolso', 'garantía'],
    respuesta: '🔄 Nuestra política de devoluciones:\n\n• Tienes 7 días desde la recepción para solicitar cambios\n• El producto debe estar sin uso y con etiquetas\n• Contáctanos por WhatsApp para coordinar\n\n¿Necesitas iniciar una devolución?',
  },
  whatsapp: {
    patrones: ['whatsapp', 'contacto', 'hablar', 'persona', 'humano', 'asesor', 'ayuda'],
    respuesta: '📱 ¡Claro! Puedes contactarnos directamente por WhatsApp haciendo clic en el ícono verde en la esquina de la pantalla. Estamos disponibles de Lunes a Sábado de 8:00 a 20:00.',
  },
  despedida: {
    patrones: ['gracias', 'ok', 'listo', 'perfecto', 'bye', 'adiós', 'adios', 'chau'],
    respuesta: '¡Gracias por tu consulta! Con gusto te seguimos atendiendo. ¡Hasta pronto! 💖',
  },
};

/**
 * POST /api/chatbot/mensaje
 * Recibe un mensaje del cliente y devuelve la respuesta del chatbot.
 */
router.post('/mensaje', async (req, res) => {
  const { mensaje, sesionId } = req.body;

  if (!mensaje || !sesionId) {
    return res.status(400).json({ error: 'El mensaje y sesionId son requeridos' });
  }

  const mensajeLower = mensaje.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Buscar qué intención coincide con el mensaje
  let respuesta = '🤔 No entendí bien tu consulta. ¿Podrías ser más específica? También puedes contactarnos por WhatsApp para ayuda personalizada.';

  for (const intent of Object.values(RESPUESTAS)) {
    if (intent.patrones.some((patron) => mensajeLower.includes(patron))) {
      respuesta = intent.respuesta;
      break;
    }
  }

  // Guardar la conversación en la base de datos
  try {
    await prisma.conversacionChatbot.createMany({
      data: [
        { sesionId, usuarioId: req.usuario?.id || null, mensaje, respuesta: '[usuario]', tipo: 'usuario' },
        { sesionId, usuarioId: req.usuario?.id || null, mensaje: respuesta, respuesta, tipo: 'bot' },
      ],
    });
  } catch (e) {
    // No fallar si hay error al guardar el historial
    console.error('Error guardando conversación chatbot:', e.message);
  }

  res.json({ respuesta, sesionId });
});

module.exports = router;
