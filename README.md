#HEAD
# 🛍️ Mi Tienda Bella — E-commerce MiPyme

> Aplicación web de comercio electrónico completa para una MiPyme paraguaya especializada en artículos para mujeres.

## ✨ Características principales

- 🛒 **Catálogo completo** con filtros por categoría, precio y búsqueda
- 🛍️ **Carrito de compras** con persistencia (login) y localStorage (anónimo)
- 💳 **Checkout al contado** — Efectivo, transferencia o tarjeta (sin crédito)
- 👑 **Panel administrador** — CRUD de productos, pedidos, usuarios, facturas
- 🏪 **POS para cajero** — Ventas presenciales con descuento de stock automático
- 🤖 **Chatbot** de preguntas frecuentes configurable
- 📱 **Botón de WhatsApp** flotante
- 🧾 **Facturación electrónica** e-Kuatia/SIFEN (Paraguay) con proveedor intercambiable
- 📸 **Imágenes** en Cloudinary

## 🚀 Stack tecnológico

| Componente | Tecnología |
|------------|-----------|
| Frontend | React + Vite + TailwindCSS |
| Backend | Node.js + Express |
| Base de datos | PostgreSQL (Neon.tech) |
| ORM | Prisma |
| Autenticación | JWT + bcrypt |
| Imágenes | Cloudinary |
| Facturación | e-Kuatia/SIFEN (proveedor configurable) |
| Deploy Frontend | Vercel |
| Deploy Backend | Render.com |
| Deploy DB | Neon.tech |

---

## 📋 Requisitos previos

- Node.js v18 o superior (`node -v`)
- npm v9 o superior (`npm -v`)
- Cuenta en [Neon.tech](https://neon.tech) (base de datos)
- Cuenta en [Cloudinary](https://cloudinary.com) (imágenes)

---

## 🛠️ Instalación y ejecución local

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/mipyme-ecommerce.git
cd mipyme-ecommerce
```

### 2. Configurar el backend

```bash
cd backend

# Copiar y configurar las variables de entorno
cp .env.example .env
# Editar .env con tus credenciales reales

# Instalar dependencias
npm install

# Generar el cliente Prisma
npm run db:generate

# Ejecutar la migración de la base de datos
npm run db:migrate

# Cargar datos de ejemplo
npm run db:seed

# Iniciar el servidor de desarrollo
npm run dev
```

El backend estará disponible en: `http://localhost:3000`

### 3. Configurar el frontend

```bash
cd frontend

# Copiar y configurar las variables de entorno
cp .env.example .env
# Por defecto: VITE_API_URL=http://localhost:3000

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

---

## 🧪 Usuarios de prueba

Después de ejecutar `npm run db:seed`:

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Administrador | admin@mitiendabella.com | Password123! |
| Cajero | cajero@mitiendabella.com | Password123! |
| Cliente | cliente@example.com | Password123! |

---

## 📁 Estructura del proyecto

```
mipyme-ecommerce/
├── frontend/          # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/   # Componentes reutilizables
│   │   ├── pages/        # Páginas de la app
│   │   ├── store/        # Estado global (Zustand)
│   │   ├── services/     # Cliente HTTP (Axios)
│   │   └── utils/        # Funciones de utilidad
│   └── vercel.json       # Config de Vercel
│
└── backend/           # Node.js + Express + Prisma
    ├── prisma/
    │   ├── schema.prisma  # Modelo de datos
    │   └── seed.js        # Datos de ejemplo
    ├── src/
    │   ├── modules/       # auth, productos, pedidos, etc.
    │   ├── middlewares/   # auth, role, validate, error
    │   └── config/        # DB, env, cloudinary
    └── .env.example       # Variables de entorno
```

---

## 🚀 Despliegue en producción

### Base de datos — Neon.tech

1. Crear cuenta en [neon.tech](https://neon.tech)
2. Crear un nuevo proyecto
3. Copiar la **Connection String** (incluye `?sslmode=require`)
4. Usar como `DATABASE_URL` en el backend

### Backend — Render.com

1. Crear cuenta en [render.com](https://render.com)
2. New → Web Service → conectar el repositorio de GitHub
3. **Build Command:** `npm install && npm run db:generate && npm run db:migrate`
4. **Start Command:** `npm start`
5. Agregar todas las variables de entorno del `.env.example`
6. La URL del servicio (ej: `https://tu-backend.onrender.com`) usarla como `FRONTEND_URL`

### Frontend — Vercel

1. Crear cuenta en [vercel.com](https://vercel.com)
2. Importar el repositorio de GitHub
3. **Root Directory:** `frontend`
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. Agregar variable de entorno:
   - `VITE_API_URL=https://tu-backend.onrender.com`

---

## 🧾 Facturación Electrónica e-Kuatia/SIFEN

El sistema está listo para conectar con un proveedor intermediario homologado con SIFEN.

### Variables de entorno necesarias

```env
FACTURACION_PROVEEDOR=sifende   # sifende | factpy | neosystem | simulacion
FACTURACION_API_URL=https://api.proveedor.com/v1
FACTURACION_API_KEY=tu-api-key
FACTURACION_RUC=80012345-6
FACTURACION_TIMBRADO=12345678
FACTURACION_PUNTO_EXPEDICION_ONLINE=001
FACTURACION_PUNTO_EXPEDICION_FISICO=002
```

> **NOTA:** Las credenciales de facturación las provee el proveedor intermediario que contrate el propietario del negocio con la DNIT. No se generan desde este código.

### Pasos del propietario del negocio

1. Tener RUC vigente inscripto ante la DNIT
2. Habilitarse como facturador electrónico ante la DNIT
3. Obtener el certificado digital P12
4. Contratar un proveedor intermediario (Sifende, FactPy, Neosystem, GuruSoft)
5. Cargar las credenciales en las variables de entorno del backend en Render.com

---

## 🔐 Seguridad

- Contraseñas cifradas con **bcrypt** (12 salt rounds)
- Autenticación con **JWT** (expiración configurable)
- **RBAC** en todos los endpoints sensibles
- Validación de datos con **Zod** en el backend
- **Helmet** para headers de seguridad HTTP
- **CORS** configurado explícitamente para el dominio del frontend
- Variables de entorno para todas las credenciales

---

## 📝 API Endpoints principales

| Método | Ruta | Acceso |
|--------|------|--------|
| POST | `/api/auth/registro` | Público |
| POST | `/api/auth/login` | Público |
| GET | `/api/productos` | Público |
| GET | `/api/categorias` | Público |
| GET | `/api/carrito` | Cliente |
| POST | `/api/pedidos` | Cliente |
| POST | `/api/pedidos/venta-presencial` | Cajero/Admin |
| GET | `/api/facturacion` | Admin |
| POST | `/api/chatbot/mensaje` | Público |
| GET | `/api/health` | Público |

---

