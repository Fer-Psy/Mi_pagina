// ============================================================
// src/middlewares/auth.middleware.js — Verificación de JWT
// ============================================================
// JWT = JSON Web Token. Es como un "carné digital" que el servidor
// le entrega al usuario cuando inicia sesión. En cada petición
// posterior, el usuario muestra ese carné para demostrar quién es.
//
// Este middleware verifica que el carné sea válido y no esté vencido.
// Si el carné es inválido, rechaza la petición con error 401.
// ============================================================

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { AppError } = require('./error.middleware');

/**
 * Middleware: verificar que la petición incluye un JWT válido.
 *
 * El JWT debe venir en el header "Authorization" así:
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 * Si es válido, adjunta los datos del usuario a req.usuario
 * para que los siguientes middlewares y controladores los usen.
 */
function verificarToken(req, res, next) {
  // 1. Obtener el header Authorization
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('No se proporcionó token de autenticación', 401, 'TOKEN_REQUERIDO'));
  }

  // 2. Extraer el token (quitar el "Bearer " del inicio)
  const token = authHeader.split(' ')[1];

  try {
    // 3. Verificar y decodificar el token usando el secreto
    // Si el token fue modificado o está vencido, jwt.verify lanza un error
    const payload = jwt.verify(token, env.JWT_SECRET);

    // 4. Adjuntar los datos del usuario a la petición
    // Los middlewares y controladores siguientes pueden acceder con req.usuario
    req.usuario = {
      id: payload.id,
      email: payload.email,
      rol: payload.rol,
    };

    // 5. Continuar al siguiente middleware o controlador
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('El token de sesión venció. Inicia sesión de nuevo.', 401, 'TOKEN_VENCIDO'));
    }
    return next(new AppError('Token de autenticación inválido', 401, 'TOKEN_INVALIDO'));
  }
}

module.exports = { verificarToken };
