// ============================================================
// src/modules/auth/auth.controller.js — Controlador de autenticación
// ============================================================
// El "controlador" es el puente entre HTTP y la lógica de negocio.
// Solo se encarga de:
// 1. Recibir la petición HTTP
// 2. Llamar al servicio correspondiente
// 3. Devolver la respuesta HTTP con el resultado
//
// NO contiene lógica de negocio — eso es del servicio.
// ============================================================

const authService = require('./auth.service');

/**
 * POST /api/auth/registro
 * Registra un nuevo cliente en el sistema.
 */
async function registro(req, res) {
  // req.body ya fue validado por el middleware "validar(registroSchema)"
  const resultado = await authService.registrar(req.body);

  // 201 = "Created" — el estándar HTTP para recursos creados exitosamente
  res.status(201).json({
    mensaje: '¡Cuenta creada exitosamente! Bienvenida a Mi Tienda Bella.',
    ...resultado,
  });
}

/**
 * POST /api/auth/login
 * Inicia sesión y devuelve un JWT.
 */
async function login(req, res) {
  const resultado = await authService.login(req.body);

  res.json({
    mensaje: '¡Inicio de sesión exitoso!',
    ...resultado,
  });
}

/**
 * GET /api/auth/perfil
 * Devuelve el perfil del usuario autenticado.
 * Requiere: JWT válido en el header Authorization.
 */
async function obtenerPerfil(req, res) {
  // req.usuario fue adjuntado por el middleware verificarToken
  const usuario = await authService.obtenerPerfil(req.usuario.id);
  res.json({ usuario });
}

/**
 * PATCH /api/auth/perfil
 * Actualiza datos del perfil del usuario autenticado.
 */
async function actualizarPerfil(req, res) {
  const usuario = await authService.actualizarPerfil(req.usuario.id, req.body);
  res.json({
    mensaje: 'Perfil actualizado correctamente',
    usuario,
  });
}

/**
 * PATCH /api/auth/cambiar-password
 * Cambia la contraseña del usuario autenticado.
 */
async function cambiarPassword(req, res) {
  await authService.cambiarPassword(req.usuario.id, req.body);
  res.json({ mensaje: 'Contraseña cambiada correctamente' });
}

/**
 * POST /api/auth/perfil/direcciones
 * Agrega una nueva dirección de entrega al usuario autenticado.
 */
async function agregarDireccion(req, res) {
  const direccion = await authService.agregarDireccion(req.usuario.id, req.body);
  res.status(201).json({ mensaje: 'Dirección agregada correctamente', direccion });
}

/**
 * DELETE /api/auth/perfil/direcciones/:id
 * Elimina una dirección de entrega del usuario autenticado.
 */
async function eliminarDireccion(req, res) {
  await authService.eliminarDireccion(req.usuario.id, req.params.id);
  res.json({ mensaje: 'Dirección eliminada correctamente' });
}

/**
 * PATCH /api/auth/perfil/direcciones/:id/principal
 * Marca una dirección como la principal del usuario.
 */
async function marcarDireccionPrincipal(req, res) {
  const direcciones = await authService.marcarDireccionPrincipal(req.usuario.id, req.params.id);
  res.json({ mensaje: 'Dirección principal actualizada', direcciones });
}

module.exports = { registro, login, obtenerPerfil, actualizarPerfil, cambiarPassword, agregarDireccion, eliminarDireccion, marcarDireccionPrincipal };
