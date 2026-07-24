// ============================================================
// src/app.js — Configuración principal de Express
// ============================================================
// Este archivo crea y configura el servidor Express con todos
// sus middlewares y rutas. No inicia el servidor (eso es server.js).
//
// Express es el "framework" (estructura) que usamos para manejar
// las peticiones HTTP del frontend.
// ============================================================

require('express-async-errors'); // Permite usar async/await en controladores sin try/catch
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const { manejarError } = require('./middlewares/error.middleware');

// Importar todas las rutas del sistema
const authRoutes = require('./modules/auth/auth.routes');
const productosRoutes = require('./modules/productos/productos.routes');
const pedidosRoutes = require('./modules/pedidos/pedidos.routes');
const facturacionRoutes = require('./modules/facturacion/facturacion.routes');
const carritoRoutes = require('./modules/carrito/carrito.routes');
const categoriasRoutes = require('./modules/categorias/categorias.routes');
const usuariosRoutes = require('./modules/usuarios/usuarios.routes');
const chatbotRoutes = require('./modules/chatbot/chatbot.routes');
const configuracionRoutes = require('./modules/configuracion/configuracion.routes');

const app = express();

// ============================================================
// MIDDLEWARES GLOBALES — Se ejecutan en TODAS las peticiones
// ============================================================

// helmet: agrega headers de seguridad automáticamente (previene ataques comunes)
app.use(helmet());

// cors: permite peticiones desde el frontend (dominio diferente al backend)
// Sin CORS, el navegador bloquearía las peticiones del frontend al backend.
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// express.json: permite leer el body de las peticiones en formato JSON
app.use(express.json({ limit: '10mb' }));

// morgan: imprime en consola cada petición recibida (útil para debugging)
// En producción usa 'combined' para logs más completos
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// ============================================================
// RUTAS — Cada módulo tiene su prefijo /api/...
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/facturacion', facturacionRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/configuracion', configuracionRoutes);

// Ruta de salud — para verificar que el servidor está funcionando
app.get('/api/health', (req, res) => {
  res.json({
    estado: 'ok',
    timestamp: new Date().toISOString(),
    entorno: env.NODE_ENV,
  });
});

// Ruta no encontrada (404)
app.use((req, res) => {
  res.status(404).json({
    error: `Ruta no encontrada: ${req.method} ${req.url}`,
    codigo: 'RUTA_NO_ENCONTRADA',
  });
});

// IMPORTANTE: El manejador de errores SIEMPRE va al final
app.use(manejarError);

module.exports = app;
