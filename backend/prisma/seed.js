// ============================================================
// seed.js — Datos de ejemplo para poblar la base de datos
// ============================================================
// Este script crea datos iniciales para que puedas probar el
// sistema sin tener que cargar todo manualmente.
//
// Para ejecutarlo: npm run db:seed
// ============================================================

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Creamos la instancia del cliente de Prisma para hablar con la DB
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // ============================================================
  // 1. LIMPIAR datos existentes (en orden inverso a las dependencias)
  // ============================================================
  await prisma.configuracion.deleteMany();
  await prisma.conversacionChatbot.deleteMany();
  await prisma.factura.deleteMany();
  await prisma.detallePedido.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.carritoItem.deleteMany();
  await prisma.carrito.deleteMany();
  await prisma.direccion.deleteMany();
  await prisma.imagenProducto.deleteMany();
  await prisma.varianteProducto.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.usuario.deleteMany();

  console.log('🗑️  Datos anteriores eliminados');

  // ============================================================
  // 2. USUARIOS — Uno por cada rol para pruebas
  // ============================================================
  // bcrypt.hash cifra la contraseña. El "12" es el nivel de seguridad
  // (más alto = más seguro pero más lento). Para producción 12 está bien.
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const admin = await prisma.usuario.create({
    data: {
      nombre: 'Admin Principal',
      email: 'admin@mitiendabella.com',
      passwordHash,
      rol: 'administrador',
      telefono: '+595981111111',
      rucCi: '80012345-6',
      razonSocial: 'Mi Tienda Bella S.R.L.',
    },
  });

  const cajero = await prisma.usuario.create({
    data: {
      nombre: 'María González',
      email: 'cajero@mitiendabella.com',
      passwordHash,
      rol: 'cajero',
      telefono: '+595982222222',
    },
  });

  const cliente = await prisma.usuario.create({
    data: {
      nombre: 'Laura Fernández',
      email: 'cliente@example.com',
      passwordHash,
      rol: 'cliente',
      telefono: '+595983333333',
      rucCi: '4567890',
    },
  });

  console.log('👥 Usuarios creados:');
  console.log('   Admin:   admin@mitiendabella.com / Password123!');
  console.log('   Cajero:  cajero@mitiendabella.com / Password123!');
  console.log('   Cliente: cliente@example.com / Password123!');

  // ============================================================
  // 3. DIRECCIÓN de ejemplo para el cliente
  // ============================================================
  await prisma.direccion.create({
    data: {
      usuarioId: cliente.id,
      alias: 'Casa',
      calle: 'Avda. España 1234',
      ciudad: 'Asunción',
      departamento: 'Central',
      referencia: 'Casa verde con portón negro',
      esPrincipal: true,
    },
  });

  // ============================================================
  // 4. CATEGORÍAS
  // ============================================================
  const categorias = await Promise.all([
    prisma.categoria.create({
      data: {
        nombre: 'Ropa',
        slug: 'ropa',
        descripcion: 'Vestidos, blusas, pantalones y más',
        imagenUrl: 'https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/accessories-bag.jpg',
      },
    }),
    prisma.categoria.create({
      data: {
        nombre: 'Calzado',
        slug: 'calzado',
        descripcion: 'Zapatos, sandalias, botines y tenis',
        imagenUrl: 'https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/shoes.png',
      },
    }),
    prisma.categoria.create({
      data: {
        nombre: 'Accesorios',
        slug: 'accesorios',
        descripcion: 'Carteras, cinturones, bufandas y más',
      },
    }),
    prisma.categoria.create({
      data: {
        nombre: 'Bisutería',
        slug: 'bisuteria',
        descripcion: 'Collares, aretes, pulseras y anillos',
      },
    }),
    prisma.categoria.create({
      data: {
        nombre: 'Cosmética',
        slug: 'cosmetica',
        descripcion: 'Maquillaje, cremas y cuidado personal',
      },
    }),
  ]);

  console.log(`📁 ${categorias.length} categorías creadas`);

  // ============================================================
  // 5. PRODUCTOS — 10 productos de ejemplo con variantes
  // ============================================================

  // Producto 1: Vestido floral
  const vestidoFloral = await prisma.producto.create({
    data: {
      categoriaId: categorias[0].id, // Ropa
      nombre: 'Vestido Floral de Verano',
      descripcion: 'Elegante vestido con estampado floral, perfecto para salidas casuales y eventos. Tela ligera 100% algodón.',
      precioBase: 180000,
      precioConDescuento: 150000,
      codigoInterno: 'VEST-001',
      tasaIva: 'diez',
      destacado: true,
      imagenes: {
        create: [
          {
            url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/product-1.jpg',
            esPrincipal: true,
            orden: 0,
          },
        ],
      },
      variantes: {
        create: [
          { talla: 'S', color: 'Rosa', stock: 5, sku: 'VEST-001-S-ROSA' },
          { talla: 'M', color: 'Rosa', stock: 8, sku: 'VEST-001-M-ROSA' },
          { talla: 'L', color: 'Rosa', stock: 3, sku: 'VEST-001-L-ROSA' },
          { talla: 'S', color: 'Blanco', stock: 4, sku: 'VEST-001-S-BLANCO' },
          { talla: 'M', color: 'Blanco', stock: 6, sku: 'VEST-001-M-BLANCO' },
        ],
      },
    },
  });

  // Producto 2: Blusa de seda
  await prisma.producto.create({
    data: {
      categoriaId: categorias[0].id,
      nombre: 'Blusa de Seda Premium',
      descripcion: 'Blusa elegante en tela de seda artificial. Ideal para el trabajo o salidas formales.',
      precioBase: 120000,
      codigoInterno: 'BLUS-001',
      tasaIva: 'diez',
      destacado: true,
      imagenes: {
        create: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/product-2.jpg', esPrincipal: true }],
      },
      variantes: {
        create: [
          { talla: 'S', color: 'Negro', stock: 10, sku: 'BLUS-001-S-NEGRO' },
          { talla: 'M', color: 'Negro', stock: 12, sku: 'BLUS-001-M-NEGRO' },
          { talla: 'L', color: 'Beige', stock: 7, sku: 'BLUS-001-L-BEIGE' },
        ],
      },
    },
  });

  // Producto 3: Sandalias de tacón
  await prisma.producto.create({
    data: {
      categoriaId: categorias[1].id, // Calzado
      nombre: 'Sandalias de Tacón Dorado',
      descripcion: 'Sandalias elegantes con tacón de 7cm. Correa ajustable. Perfectas para fiestas y eventos.',
      precioBase: 250000,
      precioConDescuento: 220000,
      codigoInterno: 'SAND-001',
      tasaIva: 'diez',
      destacado: true,
      imagenes: {
        create: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/shoes.png', esPrincipal: true }],
      },
      variantes: {
        create: [
          { talla: '36', color: 'Dorado', stock: 3, sku: 'SAND-001-36-DORADO' },
          { talla: '37', color: 'Dorado', stock: 5, sku: 'SAND-001-37-DORADO' },
          { talla: '38', color: 'Dorado', stock: 6, sku: 'SAND-001-38-DORADO' },
          { talla: '39', color: 'Dorado', stock: 4, sku: 'SAND-001-39-DORADO' },
          { talla: '40', color: 'Dorado', stock: 2, sku: 'SAND-001-40-DORADO' },
        ],
      },
    },
  });

  // Producto 4: Cartera de cuero
  await prisma.producto.create({
    data: {
      categoriaId: categorias[2].id, // Accesorios
      nombre: 'Cartera de Cuero Caramelo',
      descripcion: 'Cartera mediana de cuero genuino con compartimentos organizados. Incluye bolso auxiliar.',
      precioBase: 350000,
      codigoInterno: 'CART-001',
      tasaIva: 'diez',
      destacado: true,
      imagenes: {
        create: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/accessories-bag.jpg', esPrincipal: true }],
      },
      variantes: {
        create: [
          { color: 'Caramelo', stock: 8, sku: 'CART-001-CARAMELO' },
          { color: 'Negro', stock: 6, sku: 'CART-001-NEGRO' },
          { color: 'Bordo', stock: 4, sku: 'CART-001-BORDO' },
        ],
      },
    },
  });

  // Producto 5: Collar de perlas
  await prisma.producto.create({
    data: {
      categoriaId: categorias[3].id, // Bisutería
      nombre: 'Collar de Perlas Cultivadas',
      descripcion: 'Elegante collar con perlas cultivadas de agua dulce. Cierre de plata 925.',
      precioBase: 95000,
      codigoInterno: 'COLL-001',
      tasaIva: 'diez',
      imagenes: {
        create: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/leather-bag-gray.jpg', esPrincipal: true }],
      },
      variantes: {
        create: [
          { color: 'Blanco nacar', stock: 15, sku: 'COLL-001-BLANCO' },
          { color: 'Rosa palo', stock: 10, sku: 'COLL-001-ROSA' },
        ],
      },
    },
  });

  // Productos 6-10 más simples
  const productosSimples = [
    { nombre: 'Pantalón Palazzo Beige', precio: 160000, catIdx: 0, colores: ['Beige', 'Negro'], tallas: ['S', 'M', 'L'] },
    { nombre: 'Tenis Casuales Blancos', precio: 200000, catIdx: 1, colores: ['Blanco'], tallas: ['36', '37', '38', '39'] },
    { nombre: 'Bufanda de Alpaca', precio: 85000, catIdx: 2, colores: ['Terracota', 'Gris', 'Crema'], tallas: null },
    { nombre: 'Aretes de Aro Dorado', precio: 45000, catIdx: 3, colores: ['Dorado', 'Plateado'], tallas: null },
    { nombre: 'Sérum Facial con Vitamina C', precio: 130000, catIdx: 4, colores: null, tallas: null },
  ];

  for (const [i, p] of productosSimples.entries()) {
    const variantes = [];
    if (p.tallas && p.colores) {
      for (const t of p.tallas) {
        for (const c of p.colores) {
          variantes.push({ talla: t, color: c, stock: Math.floor(Math.random() * 10) + 1 });
        }
      }
    } else if (p.colores) {
      for (const c of p.colores) {
        variantes.push({ color: c, stock: Math.floor(Math.random() * 10) + 1 });
      }
    } else {
      variantes.push({ stock: Math.floor(Math.random() * 20) + 5 });
    }

    await prisma.producto.create({
      data: {
        categoriaId: categorias[p.catIdx].id,
        nombre: p.nombre,
        precioBase: p.precio,
        codigoInterno: `PROD-00${i + 6}`,
        tasaIva: 'diez',
        variantes: { create: variantes },
        imagenes: {
          create: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/product-2.jpg', esPrincipal: true }],
        },
      },
    });
  }

  console.log('🛍️  10 productos con variantes creados');

  // ============================================================
  // 6. CONFIGURACIÓN DEL NEGOCIO
  // ============================================================
  await prisma.configuracion.createMany({
    data: [
      { clave: 'whatsapp_numero', valor: '+595981000000' },
      { clave: 'whatsapp_mensaje', valor: 'Hola! Tengo una consulta sobre un producto de la tienda...' },
      { clave: 'nombre_negocio', valor: 'Mi Tienda Bella' },
      { clave: 'email_negocio', valor: 'info@mitiendabella.com' },
      { clave: 'direccion_negocio', valor: 'Avda. Mcal. López 1234, Asunción, Paraguay' },
      { clave: 'chatbot_saludo', valor: 'Hola! Soy la asistente virtual de Mi Tienda Bella. ¿En qué puedo ayudarte?' },
    ],
  });

  console.log('⚙️  Configuración inicial cargada');
  console.log('\n✅ Seed completado exitosamente!');
  console.log('\n📋 RESUMEN:');
  console.log('   • 3 usuarios (1 admin, 1 cajero, 1 cliente)');
  console.log('   • 5 categorías');
  console.log('   • 10 productos con variantes de talla y color');
  console.log('   • Configuración del negocio');
}

// Ejecutar el seed y manejar errores
main()
  .catch((error) => {
    console.error('❌ Error en el seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    // Siempre cerrar la conexión al terminar
    await prisma.$disconnect();
  });
