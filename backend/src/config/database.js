// ============================================================
// src/config/database.js — Cliente de Prisma (conexión a la DB)
// ============================================================
// Prisma necesita un "cliente" para comunicarse con PostgreSQL.
// Este archivo crea ESE cliente una sola vez y lo exporta
// para que cualquier módulo del backend pueda usarlo.
//
// ¿Por qué un solo cliente? Por rendimiento. Si cada archivo
// creara su propio cliente, abriríamos cientos de conexiones
// innecesarias a la base de datos.
// ============================================================

const { PrismaClient } = require('@prisma/client');

// En desarrollo, mostramos las consultas SQL en la consola
// para poder ver qué está haciendo Prisma.
// En producción desactivamos eso por performance.
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

module.exports = prisma;
