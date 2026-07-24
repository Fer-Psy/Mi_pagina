// ============================================================
// src/middlewares/role.middleware.js — Control de acceso por rol (RBAC)
// ============================================================
// RBAC = Role-Based Access Control. Sistema de permisos donde
// cada usuario solo puede hacer lo que su rol le permite.
//
// Roles del sistema:
// - cliente: puede comprar y ver su historial
// - cajero: puede registrar ventas presenciales
// - administrador: acceso total al sistema
//
// Este middleware debe usarse DESPUÉS de verificarToken,
// porque necesita los datos de req.usuario que ese pone.
// ============================================================

const { AppError } = require('./error.middleware');

/**
 * Genera un middleware que verifica si el usuario tiene alguno de los roles permitidos.
 *
 * Uso en las rutas:
 *   router.get('/admin/productos', verificarToken, requerirRol(['administrador']), handler)
 *   router.post('/venta', verificarToken, requerirRol(['administrador', 'cajero']), handler)
 *
 * @param {string[]} rolesPermitidos - Array con los roles que pueden acceder al endpoint
 * @returns {Function} Middleware de Express
 */
function requerirRol(rolesPermitidos) {
  return (req, res, next) => {
    // req.usuario fue puesto por verificarToken. Si no existe, hay un problema de orden.
    if (!req.usuario) {
      return next(new AppError('Debes estar autenticado para acceder a este recurso', 401, 'NO_AUTENTICADO'));
    }

    const { rol } = req.usuario;

    // Verificar si el rol del usuario está en la lista de permitidos
    if (!rolesPermitidos.includes(rol)) {
      return next(new AppError(
        `No tienes permiso para acceder a este recurso. Se requiere: ${rolesPermitidos.join(' o ')}`,
        403, // 403 = Forbidden (prohibido)
        'ACCESO_DENEGADO'
      ));
    }

    // El rol es válido, continuar
    next();
  };
}

module.exports = { requerirRol };
