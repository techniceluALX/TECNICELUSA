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

La interfaz administrativa está protegida por el flujo de autenticación/autorización existente. Incluye:

- **Promo Assets** en `/admin/promo-assets` para QR de tienda/campañas, QR de instalación PWA, descarga/compartir assets de marca y métricas de uso.
- **Promociones emergentes** en Admin -> Productos -> Promo para gestionar variantes pop-up de productos, servicios y trust badges con preview inmediato; el texto de servicios se guarda en D1.
- **Configuración de admin** para delivery, contacto/WhatsApp, pagos, interfaz, librería de íconos, posición del toast y ajustes promocionales.
- **SEO y redes sociales** en `/admin/seo` para configurar título, descripción y imagen OG usadas al compartir enlaces en WhatsApp, Facebook, X y otras redes.
- **Analytics de Cloudflare** vía `POST /admin/analytics`, usando la autorización de admin del Worker y persistencia en D1. Los eventos guardan `event`, `asset`, `source` y un timestamp del servidor.

La analytics de promos es best-effort y no bloquea la funcionalidad normal del storefront.

## Rutas principales

- `/` — storefront
- `/products` — catálogo de productos
- `/services` — servicios
- `/checkout` — checkout protegido
- `/profile` — perfil del cliente
- `/admin` — área administrativa
- `/admin/settings` — ajustes
- `/admin/seo` — SEO y OG tags
- `/admin/promo-assets` — hub de assets promocionales
- `/pwa-install` — guía de instalación PWA

## Documentación

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) / [docs/ARCHITECTURE.es.md](./docs/ARCHITECTURE.es.md) - Arquitectura del sistema y estructura de componentes
- [docs/BUILD.md](./docs/BUILD.md) / [docs/BUILD.es.md](./docs/BUILD.es.md) - Proceso de build y scripts
- [docs/STYLE_REFERENCE.md](./docs/STYLE_REFERENCE.md) / [docs/STYLE_REFERENCE.es.md](./docs/STYLE_REFERENCE.es.md) - Base semántica del tema visual
- [docs/cart-and-auth.md](./docs/cart-and-auth.md) / [docs/cart-and-auth.es.md](./docs/cart-and-auth.es.md) - Carrito, checkout, autenticación y comportamiento API
- [docs/AUTHENTICATION.md](./docs/AUTHENTICATION.md) / [docs/AUTHENTICATION.es.md](./docs/AUTHENTICATION.es.md) - Google, GitHub admin access y proveedor WhatsApp OTP
- [docs/WHATSAPP_CLOUD_API.md](./docs/WHATSAPP_CLOUD_API.md) - Webhook, sender y setup de WhatsApp Business Cloud API
- [docs/MERCADO_PAGO.md](./docs/MERCADO_PAGO.md) - Setup de Checkout Bricks y webhook de Mercado Pago
- [docs/PAYMENTS.md](./docs/PAYMENTS.md) - Arquitectura de proveedores y notas de rollout
- [docs/deployment.md](./docs/deployment.md) / [docs/deployment.es.md](./docs/deployment.es.md) - Guía de despliegue
- [docs/cloudflare/README.md](./docs/cloudflare/README.md) / [docs/cloudflare/README.es.md](./docs/cloudflare/README.es.md) - Operaciones Cloudflare
- [docs/AI_PROVIDERS.md](./docs/AI_PROVIDERS.md) - Cadena unificada de proveedores IA y administración de claves desde Admin → IA
- [docs/CHATBOT_CAPABILITIES.md](./docs/CHATBOT_CAPABILITIES.md) - Capacidades del chatbot, manejo de datos y verificación WebM local
- [docs/CATALOG_PDF_IMPORT.md](./docs/CATALOG_PDF_IMPORT.md) / [docs/CATALOG_PDF_IMPORT.es.md](./docs/CATALOG_PDF_IMPORT.es.md) - Importación de catálogo PDF, extracción con Vision, batches, publicación y aprobación
- [docs/ADMIN_PROMO_POPUPS.md](./docs/ADMIN_PROMO_POPUPS.md) / [docs/ADMIN_PROMO_POPUPS.es.md](./docs/ADMIN_PROMO_POPUPS.es.md) - Flujo de popups promocionales de productos, servicios y trust badges
- [docs/PUSH_NOTIFICATIONS.md](./docs/PUSH_NOTIFICATIONS.md) - Notificaciones web y configuración VAPID

## Configuración de entorno

Solo variables públicas de build:

```text
VITE_API_BASE=https://api.tecnicelu.com
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

**Producción**: Cloudflare Pages (`tecnicelu.com`) + Worker (`api.tecnicelu.com`).

- Rama: `main`
- Build: `npm install && npm run build`
- Salida: `dist/`
- Worker: `worker/`

Los despliegues de producción requieren aprobación explícita y un preview verificado. Consulta `docs/deployment.md` y `docs/cloudflare/README.md`.
