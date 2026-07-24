// ============================================================
// src/config/env.js — Validación de variables de entorno
// ============================================================
// Este archivo verifica que todas las variables de entorno
// necesarias estén definidas antes de arrancar el servidor.
// Si falta alguna, el programa se detiene con un error claro.
//
// ¿Por qué es importante? Porque sin las variables correctas,
// el servidor fallaría de formas confusas más adelante.
// Es mejor detectarlo al inicio.
// ============================================================

require('dotenv').config(); // Carga el archivo .env en process.env

/**
 * Valida que una variable de entorno exista y no esté vacía.
 * Si falta, lanza un error y detiene el servidor.
 *
 * @param {string} nombre - Nombre de la variable (ej: "DATABASE_URL")
 * @returns {string} - El valor de la variable
 */
function requerirEnv(nombre) {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(
      `❌ Variable de entorno faltante: ${nombre}\n` +
      `   Copia .env.example a .env y completa todos los valores.`
    );
  }
  return valor;
}

// Variables requeridas para que el servidor funcione
const env = {
  PORT: process.env.PORT || '3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: requerirEnv('DATABASE_URL'),
  JWT_SECRET: requerirEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Cloudinary (opcional en desarrollo si no se suben imágenes aún)
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

  // Email
  EMAIL_HOST: process.env.EMAIL_HOST || '',
  EMAIL_PORT: process.env.EMAIL_PORT || '587',
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'Mi Tienda Bella <noreply@example.com>',

  // WhatsApp
  WHATSAPP_NUMERO: process.env.WHATSAPP_NUMERO || '+595981000000',

  // Facturación electrónica
  FACTURACION_PROVEEDOR: process.env.FACTURACION_PROVEEDOR || 'simulacion',
  FACTURACION_API_URL: process.env.FACTURACION_API_URL || '',
  FACTURACION_API_KEY: process.env.FACTURACION_API_KEY || '',
  FACTURACION_RUC: process.env.FACTURACION_RUC || '',
  FACTURACION_TIMBRADO: process.env.FACTURACION_TIMBRADO || '',
  FACTURACION_PUNTO_EXPEDICION_ONLINE: process.env.FACTURACION_PUNTO_EXPEDICION_ONLINE || '001',
  FACTURACION_PUNTO_EXPEDICION_FISICO: process.env.FACTURACION_PUNTO_EXPEDICION_FISICO || '002',
};

module.exports = env;
