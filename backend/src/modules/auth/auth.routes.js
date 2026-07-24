// ============================================================
// src/modules/auth/auth.routes.js — Rutas de autenticación
// ============================================================
// Este archivo define las URLs del módulo de autenticación y
// qué middleware y controlador se ejecuta en cada una.
//
// Estructura de cada ruta:
//   router.MÉTODO('/ruta', ...middlewares, controlador)
// ============================================================

const { Router } = require('express');
const { verificarToken } = require('../../middlewares/auth.middleware');
const { validar } = require('../../middlewares/validate.middleware');
const {
  registroSchema,
  loginSchema,
  actualizarPerfilSchema,
  cambiarPasswordSchema,
} = require('./auth.schema');
const authController = require('./auth.controller');

const router = Router();

// --- Rutas públicas (no requieren JWT) ---
router.post('/registro', validar(registroSchema), authController.registro);
router.post('/login', validar(loginSchema), authController.login);

// --- Rutas privadas (requieren JWT válido) ---
router.get('/perfil', verificarToken, authController.obtenerPerfil);
router.patch('/perfil', verificarToken, validar(actualizarPerfilSchema), authController.actualizarPerfil);
router.patch('/cambiar-password', verificarToken, validar(cambiarPasswordSchema), authController.cambiarPassword);

// --- Direcciones de entrega ---
router.post('/perfil/direcciones', verificarToken, authController.agregarDireccion);
router.delete('/perfil/direcciones/:id', verificarToken, authController.eliminarDireccion);
router.patch('/perfil/direcciones/:id/principal', verificarToken, authController.marcarDireccionPrincipal);

module.exports = router;
