// ============================================================
// src/middlewares/validate.middleware.js — Validación de datos con Zod
// ============================================================
// Zod es una librería de validación de datos. Antes de que
// cualquier dato del cliente llegue a la base de datos, Zod
// verifica que tenga el formato correcto.
//
// Ejemplo: si el cliente envía { email: "no-es-email" }, Zod
// lo rechaza antes de que lleguemos a Prisma.
//
// Esto es OBLIGATORIO por seguridad: nunca confíes en los datos
// que vienen del cliente sin validarlos primero.
// ============================================================

const { ZodError } = require('zod');

/**
 * Genera un middleware que valida el body de la petición contra un esquema Zod.
 *
 * Uso en las rutas:
 *   router.post('/login', validar(loginSchema), authController.login)
 *
 * @param {ZodSchema} schema - El esquema Zod contra el cual validar
 * @returns {Function} Middleware de Express
 */
function validar(schema) {
  return (req, res, next) => {
    try {
      // schema.parse lanza un error si la validación falla
      // También transforma los datos (ej: convierte strings a números si aplica)
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Convertir los errores de Zod a un formato legible
        const errores = error.errors.map((e) => ({
          campo: e.path.join('.'),   // ej: "email" o "direccion.ciudad"
          mensaje: e.message,         // ej: "El email no es válido"
        }));

        return res.status(400).json({
          error: 'Los datos enviados son inválidos',
          codigo: 'VALIDACION_FALLIDA',
          errores,
        });
      }
      next(error);
    }
  };
}

module.exports = { validar };
