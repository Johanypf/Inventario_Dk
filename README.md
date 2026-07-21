# Inventario DK

Aplicación PWA para inventario de bodega con escáner de códigos de barras. Hasta 6 empleados pueden trabajar simultáneamente escaneando productos y registrando cantidades.

## Características

- Escáner de códigos de barras desde la cámara del celular
- Captura manual de código/barras
- Suma o reemplaza cantidades sobre productos existentes
- Sesiones de inventario con PIN
- Exportación de conteos a TXT (formato `código,cantidad`)
- Sincronización en tiempo real entre usuarios
- Subida de catálogo desde Excel, CSV o TXT
- Diseño responsive para móviles

## Tecnologías

- [Next.js](https://nextjs.org)
- [Supabase](https://supabase.com) (PostgreSQL + Realtime)
- [Tailwind CSS](https://tailwindcss.com)
- [html5-qrcode](https://github.com/mebjas/html5-qrcode)
- Desplegado en [Vercel](https://vercel.com)

## Scripts

```bash
npm run dev      # Desarrollo
npm run build    # Build producción
npm run start    # Iniciar servidor producción
```

## Base de datos

Las funciones SQL necesarias están en `supabase/migration_increment.sql`. Ejecutar en el SQL Editor de Supabase.
