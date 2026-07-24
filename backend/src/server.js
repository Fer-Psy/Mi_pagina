// ============================================================
// src/server.js — Punto de entrada del servidor
// ============================================================
// Este archivo arranca el servidor Express en el puerto configurado.
// Separado de app.js para facilitar las pruebas (los tests pueden
// importar app.js sin iniciar el servidor real).
// ============================================================

const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/database');

const PUERTO = parseInt(env.PORT, 10);

async function iniciar() {
  try {
    // Verificar conexión a la base de datos antes de iniciar
    await prisma.$connect();
    console.log('✅ Conexión a PostgreSQL establecida');

    app.listen(PUERTO, () => {
      console.log(`\n🚀 Servidor corriendo en http://localhost:${PUERTO}`);
      console.log(`📋 Entorno: ${env.NODE_ENV}`);
      console.log(`🌐 CORS habilitado para: ${env.FRONTEND_URL}`);
      console.log(`💳 Proveedor de facturación: ${env.FACTURACION_PROVEEDOR}`);
      console.log('\n📌 Endpoints disponibles:');
      console.log(`   POST   /api/auth/registro`);
      console.log(`   POST   /api/auth/login`);
      console.log(`   GET    /api/productos`);
      console.log(`   GET    /api/categorias`);
      console.log(`   GET    /api/carrito`);
      console.log(`   POST   /api/pedidos`);
      console.log(`   GET    /api/health`);
    });
  } catch (error) {
    console.error('❌ No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
}

// Manejar cierre limpio del servidor (Ctrl+C)
process.on('SIGTERM', async () => {
  console.log('\n🔴 Cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

iniciar();
