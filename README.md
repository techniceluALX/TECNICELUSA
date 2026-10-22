# TECNICELU S.A. Storefront

[English](./README.md) | [Español](./README.es.md)

The TECNICELU S.A. web storefront is a modern React + Vite + TypeScript e-commerce application with Spanish/English language support, mobile-first responsive design, and integration with Cloudflare Worker API for backend services. The Worker source lives in `worker/` (D1 + KV backed); see `docs/cloudflare/README.md` for deployment and operations.

> Last updated: 2026-09-17

## Quick Start

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

The Vite development server runs on `http://localhost:3000`. Production output is written to `dist/`.

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── admin/        # Admin interface components
│   ├── auth/         # Authentication forms
│   ├── cart/         # Cart and checkout components
│   ├── features/     # Feature-specific components
│   ├── layout/       # Layout components
│   ├── products/     # Product-related components
│   ├── services/     # Service-related components
│   └── ui/           # UI elements and shared components
├── config/            # Configuration files
├── hooks/             # Custom React hooks
├── i18n/              # Internationalization
├── lib/               # Utilities and API client
├── pages/             # Page components
├── providers/         # React context providers
├── store/             # Zustand state management
├── types/             # TypeScript type definitions
├── App.tsx            # Main application entry point
├── main.tsx           # Application bootstrap
└── index.css          # Global styles and theme definitions
```

## Technology Stack

- **Frontend**: React 19, React Router 7, TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS with custom theme system
- **Icons**: Lucide React, react-icons for third-party brands
- **Backend**: Cloudflare Worker API with D1 + KV
- **Hosting**: Cloudflare Pages
- **Build Tool**: Vite 8

## Admin Features

Admin functionality is protected by the existing authentication/authorization flow. The admin area includes:

- **Promo Assets** at `/admin/promo-assets` for generating store/campaign QR codes, generating a dedicated PWA-install QR, downloading/copying/sharing QR and brand assets, and tracking promo asset usage.
- **Promo popups** in Admin -> Products -> Promo for managing product, service, and trust-badge modal variants. Each variant has an immediate preview button; service promo copy is D1-backed.
- **Admin settings** for delivery, contact/WhatsApp, payments, interface, icon library, toast positioning, and promotional settings.
- **SEO & social sharing** at `/admin/seo` for managing Open Graph title, description, and preview image used when links are shared on WhatsApp, Facebook, X, and other networks. Includes a live preview and save flow.
- **Cloudflare analytics** via `POST /admin/analytics`, using the existing Worker admin authorization and D1 persistence. Events store `event`, `asset`, `source`, and a server-side timestamp.

The promo analytics endpoint is intentionally best-effort from the frontend so analytics failures never block normal promo or PWA functionality.

## Key Routes

- `/` — storefront
- `/products` — product catalog
- `/services` — services
- `/checkout` — protected checkout
- `/profile` — protected customer profile
- `/admin` — protected admin area
- `/admin/settings` — admin settings
- `/admin/seo` — SEO and social sharing settings (OG tags preview)
- `/admin/promo-assets` — protected promo/QR asset hub
- `/pwa-install` — PWA installation guide

## Push Notifications

Web Push supports compatible browsers and installed PWAs through the existing
Cloudflare Worker and service worker. VAPID keys are generated and configured
once with `node scripts/setup-vapid-secrets.mjs`; never commit the private key
or rotate the key pair casually because existing subscriptions depend on it.

See [docs/PUSH_NOTIFICATIONS.md](./docs/PUSH_NOTIFICATIONS.md) for the full
setup, browser behavior, and Cloudflare operations guide.

## Payments

**Nequi (manual QR) is the only payment method live in production.** Mercado
Pago Checkout Bricks is fully built, hardened and tested (signature-validated
webhook, amount/currency matching, refund handling, 34 payment tests) but is
**not deployed** — the `tecnicelu` Worker has no `MP_ACCESS_TOKEN`,
`MP_PUBLIC_KEY` or `MP_WEBHOOK_SECRET` set, so it is offered at checkout and
returns 503. Production credentials are Worker secrets, the live Worker variable
is `MERCADOPAGO_ENVIRONMENT = "production"`, and the production webhook URL is
`https://api.tecnicelu.com/payments/mercadopago/webhook`.

See [docs/MERCADO_PAGO.md](./docs/MERCADO_PAGO.md),
[docs/MERCADO_PAGO_AUDIT.md](./docs/MERCADO_PAGO_AUDIT.md) and
[docs/PAYMENTS.md](./docs/PAYMENTS.md) before changing checkout payments.

## AI Secrets CLI

`npm run ai:secrets` starts an interactive terminal UI for the AI provider
keys only (Google Gemini, OpenRouter, OpenAI-compatible chat, and embeddings —
exactly the `AI_PROVIDERS` variable set the Worker chain reads). Check login,
log in with `wrangler login`, and interactively add or overwrite secrets (API
keys are hidden while typing, and values are piped straight to `wrangler
secret put` from `worker/`). See [docs/AI_PROVIDERS.md](./docs/AI_PROVIDERS.md)
for the command flow and full provider reference.

## Documentation

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) / [docs/ARCHITECTURE.es.md](./docs/ARCHITECTURE.es.md) - System architecture and component structure
- [docs/BUILD.md](./docs/BUILD.md) / [docs/BUILD.es.md](./docs/BUILD.es.md) - Build process and scripts
- [docs/STYLE_REFERENCE.md](./docs/STYLE_REFERENCE.md) / [docs/STYLE_REFERENCE.es.md](./docs/STYLE_REFERENCE.es.md) - Semantic theme foundation and visual conventions
- [docs/cart-and-auth.md](./docs/cart-and-auth.md) / [docs/cart-and-auth.es.md](./docs/cart-and-auth.es.md) - Cart, checkout, authentication, and API behavior
- [docs/AUTHENTICATION.md](./docs/AUTHENTICATION.md) / [docs/AUTHENTICATION.es.md](./docs/AUTHENTICATION.es.md) - Google, GitHub admin access, and WhatsApp OTP provider operations
- [docs/WHATSAPP_CLOUD_API.md](./docs/WHATSAPP_CLOUD_API.md) - Meta WhatsApp Business webhook, sender, and OTP setup
- [docs/MERCADO_PAGO.md](./docs/MERCADO_PAGO.md) - Mercado Pago Checkout Bricks production setup and webhook
- [docs/PAYMENTS.md](./docs/PAYMENTS.md) - Payment-provider architecture and rollout notes
- [docs/deployment.md](./docs/deployment.md) / [docs/deployment.es.md](./docs/deployment.es.md) - Deployment guide
- [docs/cloudflare/README.md](./docs/cloudflare/README.md) / [docs/cloudflare/README.es.md](./docs/cloudflare/README.es.md) - Cloudflare operations
- [docs/AI_PROVIDERS.md](./docs/AI_PROVIDERS.md) - Unified AI provider fallback chain and Admin → IA key management
- [docs/CHATBOT_CAPABILITIES.md](./docs/CHATBOT_CAPABILITIES.md) - Current chatbot capabilities, data handling, and local WebM verification
- [docs/CATALOG_PDF_IMPORT.md](./docs/CATALOG_PDF_IMPORT.md) / [docs/CATALOG_PDF_IMPORT.es.md](./docs/CATALOG_PDF_IMPORT.es.md) - Supplier PDF catalog import, Vision extraction, draft batches, publishing, and approval flow
- [docs/ADMIN_PROMO_POPUPS.md](./docs/ADMIN_PROMO_POPUPS.md) / [docs/ADMIN_PROMO_POPUPS.es.md](./docs/ADMIN_PROMO_POPUPS.es.md) - Product, service, and trust-badge promo popup workflow
- [docs/PUSH_NOTIFICATIONS.md](./docs/PUSH_NOTIFICATIONS.md) - Web Push and VAPID configuration
- [AGENTS.md](./AGENTS.md) - AI agent guidelines and project scope

## Environment Configuration

Required environment variables (build-time, public, no secrets):

```text
VITE_API_BASE=https://api.tecnicelu.com
VITE_YOUTUBE_VIDEO_ID=<YouTube video ID>
VITE_WHATSAPP_NUMBER=<international WhatsApp number> <!-- fallback; runtime value from Admin → Ajustes -->
VITE_LOGO_DEV_TOKEN=<Logo.dev publishable key> <!-- optional; fallback key is compiled in -->
```

Configure these in your hosting provider rather than relying on local `.env` files.

## Brand Logos (Logo.dev)

The "Marcas que manejamos" strip renders brand logos from [Logo.dev](https://www.logo.dev) (`src/lib/logodev.ts`). A few entries (Nequi, Infinix) render poorly and stay on static assets. See [docs/LOGO_DOT_DEV.md](./docs/LOGO_DOT_DEV.md) for the integration, quality checks, and the current logo usage decision table.

## Development Guidelines

- Mobile-first responsive design is required for all changes
- Use existing components before creating new ones
- Follow semantic theme utilities defined in `tailwind.config.js` and `src/index.css`
- Use Lucide for UI icons; react-icons only for third-party brand marks
- Read `docs/STYLE_REFERENCE.md` before visual work
- Read `docs/cart-and-auth.md` before changing auth/cart behavior
- Validate changes with `npm run build` and `npm run lint`

## Deployment

**Active target**: Cloudflare Pages (`tecnicelu.com`)

- Production branch: `main`
- Build command: `npm install && npm run build`
- Build output: `dist/`

The backend runs on the existing Cloudflare Worker/API setup. No GitHub Actions deployment is required for the application features documented here.

See [docs/deployment.md](./docs/deployment.md) and [docs/cloudflare/README.md](./docs/cloudflare/README.md) for deployment and Cloudflare-specific operations.

## Key Features

- 🌐 Bilingual Spanish/English support
- 🛒 Shopping cart with local storage persistence
- 👤 JWT authentication with email/password, Google setup, hidden GitHub admin access, and planned WhatsApp OTP
- 📱 Mobile-first responsive design
- 🎨 Custom theme system with neon-tech aesthetic
- 🎥 YouTube video integration
- 💬 WhatsApp integration for customer support
- 🔒 Protected routes for authenticated users
- 🛡️ Error boundary and loading states
- 📦 Product catalog with filtering and sorting
- 📣 Admin promo asset and QR-code hub
- 🪧 Product, service, and trust-badge promo popups with admin preview
- 📲 PWA installation promotion flow
- 📊 Admin-only promo analytics backed by Cloudflare D1
- 🔍 SEO & social sharing with D1-managed OG tags and live preview
