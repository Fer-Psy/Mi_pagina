// ============================================================
// src/middlewares/error.middleware.js — Manejador central de errores
// ============================================================
// En Express, un "middleware" es una función que se ejecuta
// ENTRE que llega una petición y se envía la respuesta.
// Este middleware en particular captura TODOS los errores del
// sistema y los devuelve al cliente de forma uniforme.
//
// Sin este middleware, cada error podría devolver una respuesta
// diferente y confusa. Con él, siempre obtenemos:
// { error: "mensaje claro", codigo: "CODIGO_ERROR" }
// ============================================================

const env = require('../config/env');

/**
 * Clase personalizada para errores de negocio.
 * Permite crear errores con código HTTP específico y un código
 * de error legible (ej: "PRODUCTO_NO_ENCONTRADO").
 */
class AppError extends Error {
  constructor(mensaje, statusCode = 500, codigo = 'ERROR_INTERNO') {
    super(mensaje);
    this.statusCode = statusCode;
    this.codigo = codigo;
    this.esOperacional = true; // Marca que es un error esperado/controlado
  }
}

/**
 * Middleware manejador de errores de Express.
 * IMPORTANTE: debe tener exactamente 4 parámetros (err, req, res, next)
 * para que Express lo reconozca como manejador de errores.
 *
 * @param {Error} err - El error capturado
 * @param {Request} req - La petición HTTP
 * @param {Response} res - La respuesta HTTP
 * @param {Function} next - Función para pasar al siguiente middleware
 */
function manejarError(err, req, res, next) {
  // Mostramos el error en consola (en desarrollo con más detalle)
  if (env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  } else {
    console.error('❌ Error:', err.message);
  }

  // === Errores conocidos de Prisma (base de datos) ===
  // P2002 = violación de restricción UNIQUE (ej: email duplicado)
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Ya existe un registro con ese valor único',
      campo: err.meta?.target,
      codigo: 'DUPLICADO',
    });
  }

  // P2025 = registro no encontrado
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Registro no encontrado en la base de datos',
      codigo: 'NO_ENCONTRADO',
    });
  }

  // === Errores operacionales propios (AppError) ===
  if (err.esOperacional) {
    return res.status(err.statusCode).json({
      error: err.message,
      codigo: err.codigo,
    });
  }

  // === Error desconocido (bug inesperado) ===
  // En producción no revelamos detalles internos por seguridad
  res.status(500).json({
    error: env.NODE_ENV === 'development'
      ? err.message
      : 'Ocurrió un error interno del servidor. Por favor intenta de nuevo.',
    codigo: 'ERROR_INTERNO',
  });
}

module.exports = { manejarError, AppError };
