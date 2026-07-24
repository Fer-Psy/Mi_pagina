// ============================================================
// src/modules/auth/auth.schema.js — Esquemas de validación con Zod
// ============================================================
// Aquí definimos las "reglas" que deben cumplir los datos de
// registro e inicio de sesión. Zod verifica estos esquemas
// automáticamente antes de que el controlador procese los datos.
// ============================================================

const { z } = require('zod');

// Esquema para REGISTRO de nuevo usuario
const registroSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es requerido' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),

  email: z
    .string({ required_error: 'El email es requerido' })
    .email('El email no tiene un formato válido')
    .toLowerCase()
    .trim(),

  password: z
    .string({ required_error: 'La contraseña es requerida' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe incluir al menos una letra mayúscula')
    .regex(/[0-9]/, 'La contraseña debe incluir al menos un número'),

  telefono: z
    .string()
    .optional()
    .transform((v) => v || null),
});

// Esquema para INICIO DE SESIÓN
const loginSchema = z.object({
  email: z
    .string({ required_error: 'El email es requerido' })
    .email('El email no tiene un formato válido')
    .toLowerCase()
    .trim(),

  password: z
    .string({ required_error: 'La contraseña es requerida' }),
});

// Esquema para actualizar el perfil del usuario
const actualizarPerfilSchema = z.object({
  nombre: z.string().min(2).max(100).trim().optional(),
  telefono: z.string().optional(),
  rucCi: z.string().max(20).optional(),
  razonSocial: z.string().max(200).optional(),
});

// Esquema para cambiar contraseña
const cambiarPasswordSchema = z.object({
  passwordActual: z.string({ required_error: 'La contraseña actual es requerida' }),
  passwordNueva: z
    .string()
    .min(8, 'La contraseña nueva debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe incluir al menos una letra mayúscula')
    .regex(/[0-9]/, 'La contraseña debe incluir al menos un número'),
});

module.exports = { registroSchema, loginSchema, actualizarPerfilSchema, cambiarPasswordSchema };
