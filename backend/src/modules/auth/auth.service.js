// ============================================================
// src/modules/auth/auth.service.js — Lógica de negocio de autenticación
// ============================================================
// El "servicio" contiene TODA la lógica de negocio.
// No sabe nada de HTTP (eso es trabajo del controlador).
// Solo sabe cómo registrar usuarios, verificar contraseñas, etc.
//
// Separar la lógica del controlador nos permite:
// 1. Probar la lógica sin simular peticiones HTTP
// 2. Reusar la misma lógica desde distintos controladores
// ============================================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/database');
const env = require('../../config/env');
const { AppError } = require('../../middlewares/error.middleware');

/**
 * Registra un nuevo usuario en el sistema.
 *
 * Recibe: { nombre, email, password, telefono }
 * Hace: verifica que el email no exista, cifra la contraseña, crea el usuario
 * Devuelve: { usuario, token }
 */
async function registrar({ nombre, email, password, telefono }) {
  // 1. Verificar que el email no esté ya registrado
  const usuarioExistente = await prisma.usuario.findUnique({ where: { email } });
  if (usuarioExistente) {
    throw new AppError('Ya existe una cuenta con ese email', 409, 'EMAIL_DUPLICADO');
  }

  // 2. Cifrar la contraseña con bcrypt
  // bcrypt.hash convierte "Password123!" en algo como "$2b$12$xyz..."
  // El número 12 es el "costo de hashing" — más alto = más seguro pero más lento.
  // NUNCA se guarda la contraseña real, solo el hash.
  const passwordHash = await bcrypt.hash(password, 12);

  // 3. Crear el usuario en la base de datos
  const usuario = await prisma.usuario.create({
    data: {
      nombre,
      email,
      passwordHash,
      telefono: telefono || null,
      rol: 'cliente', // Siempre es cliente al registrarse
    },
    // "select" indica qué campos devolver (nunca devolvemos el hash de la contraseña)
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      telefono: true,
      creadoEn: true,
    },
  });

  // 4. Crear el carrito vacío para el nuevo cliente
  await prisma.carrito.create({ data: { usuarioId: usuario.id } });

  // 5. Generar el JWT para que el usuario quede logueado automáticamente
  const token = generarToken(usuario);

  return { usuario, token };
}

/**
 * Inicia sesión de un usuario existente.
 *
 * Recibe: { email, password }
 * Hace: busca el usuario, compara la contraseña con el hash, genera el JWT
 * Devuelve: { usuario, token }
 */
async function login({ email, password }) {
  // 1. Buscar el usuario por email
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  // IMPORTANTE: el mensaje de error es genérico a propósito.
  // Si dijéramos "email no encontrado" vs "contraseña incorrecta",
  // un atacante podría saber qué emails están registrados.
  if (!usuario || !usuario.activo) {
    throw new AppError('Email o contraseña incorrectos', 401, 'CREDENCIALES_INVALIDAS');
  }

  // 2. Comparar la contraseña ingresada con el hash guardado
  // bcrypt.compare hace esto de forma segura
  const passwordValida = await bcrypt.compare(password, usuario.passwordHash);
  if (!passwordValida) {
    throw new AppError('Email o contraseña incorrectos', 401, 'CREDENCIALES_INVALIDAS');
  }

  // 3. Generar y devolver el JWT
  const token = generarToken(usuario);

  // Devolver datos del usuario sin el hash de la contraseña
  const { passwordHash, ...usuarioSinPassword } = usuario;
  return { usuario: usuarioSinPassword, token };
}

/**
 * Obtiene el perfil completo del usuario autenticado.
 *
 * Recibe: usuarioId (del JWT decodificado)
 * Devuelve: datos del usuario con sus direcciones
 */
async function obtenerPerfil(usuarioId) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      telefono: true,
      rucCi: true,
      razonSocial: true,
      creadoEn: true,
      direcciones: true,
    },
  });

  if (!usuario) {
    throw new AppError('Usuario no encontrado', 404, 'USUARIO_NO_ENCONTRADO');
  }

  return usuario;
}

/**
 * Actualiza el perfil del usuario.
 *
 * Recibe: usuarioId, datos a actualizar
 * Devuelve: usuario actualizado
 */
async function actualizarPerfil(usuarioId, datos) {
  const usuario = await prisma.usuario.update({
    where: { id: usuarioId },
    data: datos,
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      telefono: true,
      rucCi: true,
      razonSocial: true,
    },
  });
  return usuario;
}

/**
 * Cambia la contraseña del usuario.
 *
 * Recibe: usuarioId, passwordActual, passwordNueva
 * Hace: verifica la contraseña actual, hashea la nueva y la guarda
 */
async function cambiarPassword(usuarioId, { passwordActual, passwordNueva }) {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) throw new AppError('Usuario no encontrado', 404, 'USUARIO_NO_ENCONTRADO');

  const passwordValida = await bcrypt.compare(passwordActual, usuario.passwordHash);
  if (!passwordValida) {
    throw new AppError('La contraseña actual es incorrecta', 400, 'PASSWORD_INCORRECTA');
  }

  const nuevoHash = await bcrypt.hash(passwordNueva, 12);
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { passwordHash: nuevoHash },
  });
}

// ============================================================
// FUNCIÓN AUXILIAR: Generar JWT
// ============================================================
/**
 * Crea un JWT firmado con los datos básicos del usuario.
 * El JWT tiene fecha de expiración según JWT_EXPIRES_IN del .env.
 *
 * @param {object} usuario - El objeto usuario de la DB
 * @returns {string} El token JWT como string
 */
function generarToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

/**
 * Agrega una nueva dirección de entrega al usuario.
 * Si es la primera dirección del usuario, la marca como principal automáticamente.
 */
async function agregarDireccion(usuarioId, { alias, calle, ciudad, departamento, referencia, esPrincipal }) {
  // Si pide ser principal, quitarle el flag a todas las demás
  if (esPrincipal) {
    await prisma.direccion.updateMany({
      where: { usuarioId },
      data: { esPrincipal: false },
    });
  }

  // Si no tiene ninguna dirección todavía, esta será la principal por defecto
  const cantExistentes = await prisma.direccion.count({ where: { usuarioId } });
  const marcarPrincipal = esPrincipal || cantExistentes === 0;

  const direccion = await prisma.direccion.create({
    data: {
      usuarioId,
      alias: alias || null,
      calle,
      ciudad,
      departamento: departamento || null,
      referencia: referencia || null,
      esPrincipal: marcarPrincipal,
    },
  });

  return direccion;
}

/**
 * Elimina una dirección de entrega.
 * Solo puede eliminar direcciones que le pertenecen al usuario.
 */
async function eliminarDireccion(usuarioId, direccionId) {
  const direccion = await prisma.direccion.findFirst({
    where: { id: direccionId, usuarioId },
  });

  if (!direccion) {
    throw new AppError('Dirección no encontrada', 404, 'DIRECCION_NO_ENCONTRADA');
  }

  await prisma.direccion.delete({ where: { id: direccionId } });
}

/**
 * Marca una dirección como la principal del usuario.
 * Todas las demás direcciones se desmarcán automáticamente.
 */
async function marcarDireccionPrincipal(usuarioId, direccionId) {
  // Verificar que la dirección pertenece al usuario
  const direccion = await prisma.direccion.findFirst({
    where: { id: direccionId, usuarioId },
  });

  if (!direccion) {
    throw new AppError('Dirección no encontrada', 404, 'DIRECCION_NO_ENCONTRADA');
  }

  // Usar una transacción para hacer ambas operaciones atómicamente
  await prisma.$transaction([
    prisma.direccion.updateMany({
      where: { usuarioId },
      data: { esPrincipal: false },
    }),
    prisma.direccion.update({
      where: { id: direccionId },
      data: { esPrincipal: true },
    }),
  ]);

  return prisma.direccion.findMany({ where: { usuarioId } });
}

module.exports = { registrar, login, obtenerPerfil, actualizarPerfil, cambiarPassword, agregarDireccion, eliminarDireccion, marcarDireccionPrincipal };
