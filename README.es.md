# Tienda TECNICELU

[English](./README.md) | [Español](./README.es.md)

La tienda TECNICELU es una aplicación de comercio electrónico React + Vite + TypeScript con soporte español/inglés, diseño mobile-first y backend Cloudflare Worker con D1 + KV.

## Inicio rápido

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

El servidor de desarrollo Vite usa `http://localhost:3000` y la salida de producción queda en `dist/`.

## Estructura

- `src/` — aplicación web/PWA React/Vite
- `src/components/admin/` — interfaz administrativa
- `src/i18n/` — traducciones ES/EN
- `src/pages/` — páginas, incluido el hub promocional y la instalación PWA
- `worker/` — API Cloudflare Worker, migraciones D1 e integración KV
- `mobile/` — línea adicional de Expo; no reemplaza web/PWA
- `data/` — datos de importación de catálogo
- `docs/` — documentación técnica y operativa bilingüe
- `brand-logos/` — recursos de marcas y reglas de uso

## Stack tecnológico

- **Frontend**: React 19, React Router 7, TypeScript
- **Estado**: Zustand
- **Estilos**: Tailwind CSS con sistema de tema semántico
- **Iconos**: Lucide React; `react-icons` para marcas de terceros
- **Backend**: Cloudflare Worker + D1 + KV
- **Hosting web**: Cloudflare Pages
- **Build**: Vite 8

## Funciones de administración

- **Promo Assets** en `/admin/promo-assets`: QR de tienda/campañas, QR específico de instalación PWA, acciones de descargar/copiar/compartir y analítica.
- **Ajustes**: entrega, contacto/WhatsApp, pagos, interfaz, biblioteca de iconos, posición de toast y tiempos promocionales.
- **Analítica promocional** mediante `POST /admin/analytics`, protegida por el guard existente de administrador y persistida en D1. Registra `event`, `asset`, `source` y timestamp del servidor.

La analítica promocional es deliberadamente best-effort en el frontend para que un fallo de analítica nunca bloquee la promoción o instalación PWA.

## Rutas principales

- `/` — tienda
- `/products` — catálogo
- `/services` — servicios/reparaciones
- `/checkout` — checkout protegido
- `/profile` — perfil protegido
- `/admin` — área administrativa protegida
- `/admin/settings` — ajustes
- `/admin/promo-assets` — hub promocional/QR
- `/pwa-install` — guía de instalación PWA

## Documentación

Consulta [`docs/DOCUMENTATION.md`](./docs/DOCUMENTATION.md) para el índice completo y el estado de la documentación.

- Arquitectura: `docs/ARCHITECTURE.md` / `docs/ARCHITECTURE.es.md`
- Build: `docs/BUILD.md` / `docs/BUILD.es.md`
- Carrito y auth: `docs/cart-and-auth.md` / `docs/cart-and-auth.es.md`
- Proveedores de autenticación: `docs/AUTHENTICATION.md` / `docs/AUTHENTICATION.es.md`
- WhatsApp Business y OTP: `docs/WHATSAPP_CLOUD_API.md`
- Despliegue: `docs/deployment.md` / `docs/deployment.es.md`
- Cloudflare: `docs/cloudflare/README.md` / `docs/cloudflare/README.es.md`
- Roadmap: `docs/ROADMAP.md` / `docs/ROADMAP.es.md`
- Importación de productos: `docs/ADMIN_PRODUCT_IMPORT.md` / `docs/ADMIN_PRODUCT_IMPORT.es.md`
- Importación de catálogo PDF de proveedores: `docs/CATALOG_PDF_IMPORT.md` / `docs/CATALOG_PDF_IMPORT.es.md`
- Notificaciones: `docs/NOTIFICATIONS.md` / `docs/NOTIFICATIONS.es.md`
- Conversaciones: `docs/CONVERSATIONS.md` / `docs/CONVERSATIONS.es.md`
- Voz/IA: `docs/VOICE-AI.md` / `docs/VOICE-AI.es.md`
- Expo: `docs/EXPO_MOBILE_PLAN.md` / `docs/EXPO_MOBILE_PLAN.es.md`
- Pagos: `docs/PAYMENTS.md` / `docs/PAYMENTS.es.md`

## Configuración de entorno

Solo variables públicas de build:

```text
VITE_API_BASE=https://api.tecnicelu.store
VITE_YOUTUBE_VIDEO_ID=<ID de YouTube>
VITE_WHATSAPP_NUMBER=<número internacional de WhatsApp>
```

No pongas credenciales de proveedores ni otros secretos en el frontend. Los secretos del Worker deben permanecer en Wrangler/Cloudflare.

## Directrices de desarrollo

- Mobile-first es obligatorio.
- Reutiliza componentes existentes.
- Sigue el sistema de tema semántico de `tailwind.config.js` y `src/index.css`.
- Usa Lucide para UI y `react-icons` solo para marcas de terceros.
- Lee la documentación relevante antes de modificar auth/carrito, Cloudflare o estilos.
- Valida con `npm run build` y `npm run lint`.
- No añadas GitHub Actions para el despliegue de la aplicación; el flujo actual es Cloudflare Pages + Worker.

## Despliegue

**Producción**: Cloudflare Pages (`tecnicelu.store`) + Worker (`api.tecnicelu.store`).

- Rama: `main`
- Build: `npm install && npm run build`
- Salida: `dist/`
- Worker: `worker/`

Los despliegues de producción requieren aprobación explícita y un preview verificado. Consulta `docs/deployment.md` y `docs/cloudflare/README.md`.
