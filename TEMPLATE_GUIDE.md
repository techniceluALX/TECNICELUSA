# TECNICELU S.A. Storefront — Template Guide for New Business Deployments

This document explains how to adapt this production-ready storefront for a new business (branding, products, services, domain, payments). It is organized by **what to replace** and **how to do it**, plus a **repo strategy** for multi-client versions.

---

## 1. Quick Reference: Files That Change Per Client

| Area | Primary Files | Notes |
|------|--------------|-------|
| **Brand Identity** | `src/config/brand.ts`, `index.html`, `vite.config.ts` (PWA manifest), `public/logos/brands/` | Company name, tagline, colors, logos, favicon |
| **i18n (All UI Text)** | `src/i18n/es.ts`, `src/i18n/en.ts` | Every user-facing string — admin included |
| **Runtime Config (D1-backed)** | Admin → **Ajustes** (Settings) | WhatsApp #, shipping price, free-shipping rules, promo timings, trust badges, SEO meta, icon library, hero video |
| **Build-time Config** | `.env.production` (reference), Cloudflare Pages env vars | `VITE_API_BASE`, `VITE_WHATSAPP_NUMBER`, `VITE_YOUTUBE_VIDEO_ID`, `VITE_LOGO_DEV_TOKEN` |
| **Worker Config** | `worker/wrangler.toml` | Worker name, D1/KV/R2 bindings, custom domain, secrets, OAuth client IDs |
| **Product Catalog** | D1 `products` table (admin UI) | No static JSON — managed entirely via `/admin` |
| **Service Catalog** | `src/config/serviceDevices.ts`, D1 `services` | Device types, brands, models for repair requests |
| **Payment Methods** | `src/lib/paymentMethods.ts`, Worker secrets | Mercado Pago (prod/sandbox), Nequi, others |
| **Domain/DNS** | Cloudflare Pages custom domain, Worker custom domain | `tecnicelu.store` → new domain |
| **Assets** | `public/logos/`, `public/favicon/`, `public/videos/` | Brand logos, payment logos, hero video/poster |

---

## 2. Brand Identity — Complete Replacement Checklist

### 2.1 Core Brand Config (`src/config/brand.ts`)
```typescript
export const brandConfig = {
  name: 'NEW BUSINESS S.A.',           // ← Replace (must include "S.A." per branding standard)
  tagline: 'Your new tagline here',    // ← Replace
  warrantyText: '2 Year Warranty',     // ← Adjust if different
  colors: { ... },                     // ← Semantic tokens (see theme.ts + index.css)
  gradients: { ... },                  // ← Used in hero, buttons
  fonts: { heading: 'Oxanium', body: 'sans-serif' }, // ← Keep or change
  social: { whatsapp: '573XXXXXXXXX' }, // ← Fallback; runtime value from Admin → Ajustes
};
```

### 2.2 HTML Meta & PWA Manifest (`index.html` + `vite.config.ts`)
**index.html** — replace all occurrences:
- `<title>NEW BUSINESS S.A.</title>`
- `og:site_name`, `og:title`, `twitter:title` → "NEW BUSINESS S.A."
- `og:description`, `twitter:description` → new tagline
- `og:image`, `twitter:image` → new wordlogo URL (R2/custom domain)
- `meta[name="theme-color"]` → new brand color

**vite.config.ts** — PWA manifest section:
```typescript
manifest: {
  name: 'NEW BUSINESS S.A.',
  short_name: 'NEW BUSINESS',          // ≤12 chars for home screen
  description: 'Your store description',
  theme_color: '#YOUR_BRAND_COLOR',
  background_color: '#YOUR_BG_COLOR',
  icons: [ ... your PNG icons ... ],   // iOS requires PNG (not webp)
}
```

### 2.3 Logo Assets (`public/logos/brands/`)
| Asset | Purpose | Specs |
|-------|---------|-------|
| `wordlogo.png` | Wordmark "NEW BUSINESS S.A." | Transparent PNG, used in header, footer, OG image |
| `wordlogo-og.png` | Social sharing (1200×630) | PNG, includes tagline |
| `wordlogo-apple-touch-icon.png` | iOS home screen | 180×180 PNG |
| `icon-192.png`, `icon-512.png` | PWA icons | PNG, maskable |
| Brand strip logos | Home "Marcas que manejamos" | Logo.dev or static (see `src/lib/logodev.ts`) |

> **Rule**: Use the `Logo` component (`src/components/ui/Logo.tsx`) with `variant="wordmark|icon|both"` instead of raw `<img>` tags. Never reconstruct the name at runtime — strings are authored in full in i18n files.

### 2.4 Favicons (`public/favicon/`)
Replace all files. Keep filenames identical. Required:
- `favicon.ico` (32×32 multi-size)
- `favicon-16x16.png`, `favicon-32x32.png`
- `icon-192.png`, `icon-512.png` (PWA)
- `apple-touch-icon.png` (180×180 PNG — **iOS requires PNG**)
- `wordlogo-apple-touch-icon.png` (branded variant)

---

## 3. Internationalization — All UI Text

**Every string** in the app (storefront + admin) lives in:
- `src/i18n/es.ts` — Spanish (primary)
- `src/i18n/en.ts` — English

### What to Translate/Adapt
- **Company name**: Appears as `TECNICELU S.A.` in ~50 keys → replace with `NEW BUSINESS S.A.`
- **Tagline**: `hero_tagline`, `footer_tagline`, chat welcome message
- **Product/Service labels**: `nav_products`, `nav_services`, `services_title`, etc.
- **Admin panel**: All `admin_*` keys (tabs, buttons, hints, tooltips)
- **Chatbot**: `chat_welcome`, `chat_quick_options`, tooltips
- **Legal pages**: Privacy policy, terms — create new content

### Process
1. Copy `es.ts` → `es-new.ts`, do find/replace for company-specific terms
2. Copy `en.ts` → `en-new.ts`, same process
3. Rename to `es.ts`/`en.ts` (or keep both locales if multi-lang)
4. Run `npm run lint` — brand-check.sh will flag any bare "TECNICELU" without "S.A."

> **Note**: WhatsApp message bodies (order confirmations, service requests) are intentionally Spanish-only in `src/lib/whatsapp.ts`. Adapt those strings there.

---

## 4. Runtime Configuration (Admin → Ajustes)

**No code changes needed** — all storefront configuration lives in D1 `settings` table, edited via `/admin` → **Ajustes** tabs:

| Tab | Settings | Where Used |
|-----|----------|------------|
| **Envío** | `shipping_price`, `free_shipping_threshold`, date ranges, weekly schedule, rapid delivery fee | Cart, checkout, product cards |
| **WhatsApp** | `whatsapp_number` (validated CO), `nequi_number`, `nequi_qr` | Floating button, banners, footer, checkout confirmation |
| **Promo** | `promo_enabled`, `promo_delay`, `promo_autoclose`, `promo_service_title/body/cta` | Timed modal popups (3 variants) |
| **Insignias** | 5 global trust badges (label ES/EN, icon, variant, enabled) | Hero, catalog, product detail |
| **SEO y redes** | `og_title`, `og_description`, `og_image` | `<meta>` tags via `usePageMeta` hook |
| **Interfaz** | Icon library (Lucide/Phosphor/Font Awesome) | All generic UI icons |
| **Notificaciones** | VAPID keys (Worker secrets), toast position | Web Push, toast notifications |
| **General** | Hero video (file/YouTube ID), promo QR download | Home hero, `/admin/qr` hub |

> **Deployment**: After deploying Worker + frontend, visit `/admin` → **Ajustes** and configure each tab. Values apply instantly — no rebuild.

---

## 5. Build-Time Environment Variables (Cloudflare Pages)

Set in **Cloudflare Pages project settings** → Environment variables (Production + Preview):

| Variable | Example | Purpose |
|----------|---------|---------|
| `VITE_API_BASE` | `https://api.newbusiness.store` | Worker API endpoint |
| `VITE_WHATSAPP_NUMBER` | `573001234567` | Fallback WhatsApp (runtime overrides from D1) |
| `VITE_YOUTUBE_VIDEO_ID` | `dQw4w9WgXcQ` | Hero video (or use file upload in Admin → General) |
| `VITE_LOGO_DEV_TOKEN` | `pk_xxxxx` | Logo.dev publishable key for brand strip logos |
| `VITE_HERO_VIDEO_URL` | *(optional)* | Direct video file URL (R2/custom domain) |

> **Never put secrets in `VITE_*`** — they are baked into the client bundle.

---

## 6. Worker Configuration (`worker/wrangler.toml`)

### 6.1 Identity & Bindings
```toml
name = "newbusiness"                    # ← Worker name (unique per client)
main = "src/notifications-worker.js"
compatibility_date = "2026-08-29"

[[d1_databases]]
binding = "DB"
database_name = "newbusiness"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← Create new D1

[[d1_databases]]
binding = "SKILLS"
database_name = "newbusiness-skills"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← Create new skills D1

[[kv_namespaces]]
binding = "SESSIONS"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # ← Create new KV

[[kv_namespaces]]
binding = "CATALOG_KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # ← Create new KV

[[r2_buckets]]
binding = "ASSETS_BUCKET"
bucket_name = "newbusiness-assets"       # ← Create new R2 bucket

[[r2_buckets]]
binding = "MEDIA_BUCKET"
bucket_name = "newbusiness-media"        # ← Create new R2 bucket
```

### 6.2 Custom Domain & Routes
```toml
[[routes]]
pattern = "api.newbusiness.store"
custom_domain = true
```

### 6.3 Vars (Non-Secrets)
```toml
[vars]
API_URL = "https://api.newbusiness.store"
FRONTEND_URL = "https://newbusiness.store"
FORWARD_TO_EMAIL = "admin@newbusiness.com"
GITHUB_REPO = "yourorg/newbusiness"
GITHUB_ADMIN_ORG = "yourorg"
GH_OAUTH_CLIENT_ID = "Ov23li..."
GOOGLE_OAUTH_CLIENT_ID = "xxx.apps.googleusercontent.com"
MERCADOPAGO_ENVIRONMENT = "production"
WHATSAPP_OTP_ENABLED = "false"
```

### 6.4 Secrets (Set via `wrangler secret put`)
| Secret | Purpose |
|--------|---------|
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web Push |
| `GITHUB_TOKEN` | Admin image upload (fine-grained PAT: repo contents:write) |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OIDC |
| `META_WHATSAPP_VERIFY_TOKEN`, `META_APP_SECRET`, `META_WHATSAPP_ACCESS_TOKEN`, `META_WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Cloud API |
| `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY` | Mercado Pago (production) |

### 6.5 Preview Environment
Duplicate `[env.preview]` block with:
- `name = "newbusiness-preview"`
- Separate KV/D1/R2 bindings (or share production for testing)
- `MERCADOPAGO_ENVIRONMENT = "sandbox"`
- `TURNSTILE_SECRET = "1x0000000000000000000000000000000AA"` (Cloudflare test key)

---

## 7. Product & Service Catalog

### 7.1 Products — D1 is Source of Truth
- **No static `products.json`** — catalog lives in D1 `products` table
- Admin UI (`/admin` → **Productos**) handles CRUD, imports, discounts, publishing
- Images upload to R2 via `POST /upload` → stored as `products/<category>/<uuid>.<ext>`
- Served from `assets.newbusiness.store` (R2 custom domain)

### 7.2 Services — Repair Request Inbox
- Configure device types in `src/config/serviceDevices.ts`:
```typescript
export const serviceDevices = [
  { type: 'computers', labelKey: 'service_computers', brands: ['Dell', 'HP', 'Lenovo', ...] },
  { type: 'phones', labelKey: 'service_phones', brands: ['Samsung', 'Apple', 'Xiaomi', ...] },
  // Add/remove categories per client
];
```
- Brands/models also manageable via `/admin` → **Marcas**
- Inbound requests appear in `/admin` → **Servicios**

---

## 8. Payment Methods

### 8.1 Mercado Pago (Production-Ready)
- Worker secrets: `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`
- `MERCADOPAGO_ENVIRONMENT = "production"` in `[vars]`
- Webhook: `https://api.newbusiness.store/payments/mercadopago/webhook`
- Checkout Bricks integrated in `CheckoutPage.tsx`
- **Never move credentials to `VITE_*`, D1, or frontend code**

### 8.2 Nequi (Colombia)
- Admin → **Ajustes** → **WhatsApp y Nequi**: `nequi_number`, `nequi_qr`
- Displayed in checkout via `src/lib/paymentMethods.ts`

### 8.3 Other Methods
Edit `src/lib/paymentMethods.ts` to add/remove payment method logos (static assets in `public/logos/`).

---

## 9. Domain & DNS Strategy

| Component | Current | New Client |
|-----------|---------|------------|
| Frontend (Pages) | `tecnicelu.store` | `newbusiness.store` |
| API Worker | `api.tecnicelu.store` | `api.newbusiness.store` |
| Assets (R2) | `assets.tecnicelu.store` | `assets.newbusiness.store` |
| Media (R2) | *(custom domain optional)* | `media.newbusiness.store` |

**Steps**:
1. Add custom domains in Cloudflare Pages project + Worker routes
2. Create CNAME records in Cloudflare DNS pointing to Pages/Worker hostnames
3. Update `VITE_API_BASE`, `FRONTEND_URL`, `API_URL` vars
4. Update CORS in Worker (allowed origins must include new frontend domain)
5. Update `og:url`, `og:image` in `index.html` and D1 SEO settings

---

## 10. Assets & Media

| Asset Type | Location | Replacement |
|------------|----------|-------------|
| Brand logos | `public/logos/brands/` | New wordlogo, brand strip logos |
| Payment logos | `public/logos/` (nequi, davivienda, bancolombia) | Client's payment partners |
| Hero video | `public/videos/TCpromo.mp4` + poster | New promotional video |
| Hero video (YouTube) | `VITE_YOUTUBE_VIDEO_ID` | New YouTube ID or upload file |
| QR codes | Generated at runtime via `/admin/qr` | Auto-generated for new domain |

---

## 11. Multi-Client Repo Strategy

### Option A: Monorepo with Client Packages (Recommended for 2-10 clients)
```
repo-root/
├── packages/
│   ├── core/              # Shared React components, hooks, stores, utils
│   ├── worker-core/       # Shared Worker logic (auth, catalog, orders, chatbot)
│   └── client-<name>/     # Per-client config + overrides
│       ├── frontend/
│       │   ├── src/config/brand.ts
│       │   ├── src/i18n/es.ts, en.ts
│       │   ├── vite.config.ts (manifest overrides)
│       │   └── public/logos/, favicon/
│       ├── worker/
│       │   └── wrangler.toml (bindings, vars, secrets refs)
│       └── package.json
├── turbo.json             # Turborepo config
└── package.json           # Workspace root
```
**Pros**: Single source of truth for core logic; easy to propagate fixes; shared CI
**Cons**: Requires Turborepo/Nx setup; more complex initially

### Option B: Template Repo + Fork Per Client (Simplest)
1. **Create a "template" branch** in this repo with all client-specific values parameterized (or documented in this guide)
2. **For each new client**: Fork the repo → rename → follow this guide's checklists
3. **Sync upstream fixes**: `git fetch upstream && git merge upstream/main` (resolve conflicts in config files only)

**Pros**: Zero tooling changes; each client fully independent; simple mental model
**Cons**: Manual sync for core fixes; drift over time

### Option C: Git Subtree / Submodule for Core
- Core logic in separate repo (`storefront-core`)
- Each client repo includes it as subtree/submodule
- Client repo only contains config, assets, `wrangler.toml`

**Pros**: Clean separation; core updates via `git subtree pull`
**Cons**: Subtree/submodule friction; CI complexity

---

## 12. Deployment Checklist for New Client

### 12.1 One-Time Setup
- [ ] Create Cloudflare account / use existing
- [ ] Create D1 databases: `newbusiness`, `newbusiness-skills`
- [ ] Create KV namespaces: `SESSIONS`, `CATALOG_KV`
- [ ] Create R2 buckets: `newbusiness-assets`, `newbusiness-media`
- [ ] Create Vectorize index: `newbusiness-skills-semantic`
- [ ] Enable Email Routing for domain (for inbound email → conversations)
- [ ] Generate VAPID keys: `node scripts/setup-vapid-secrets.mjs`
- [ ] Create OAuth apps: Google, GitHub (admin org), Mercado Pago
- [ ] Configure Turnstile site/secret keys

### 12.2 Worker Deploy
```bash
cd worker
npm install
# Set all secrets via wrangler secret put
npm run deploy          # deploys to production (wrangler.toml)
npm run deploy:preview  # deploys to preview env
```

### 12.3 Frontend Deploy
- Connect repo to Cloudflare Pages project `newbusiness`
- Build command: `npm install && npm run build`
- Output: `dist`
- Set `VITE_*` environment variables in Pages dashboard
- Add custom domain `newbusiness.store`

### 12.4 Post-Deploy Configuration
- [ ] Visit `/admin` → **Ajustes** → configure all tabs
- [ ] Import/upload product catalog via **Productos** tab
- [ ] Configure service device types in `src/config/serviceDevices.ts` (rebuild + deploy)
- [ ] Test checkout flow (Mercado Pago sandbox → production)
- [ ] Test WhatsApp webhook (Meta verification)
- [ ] Test Web Push subscription + admin notification send
- [ ] Verify PWA install on iOS + Android
- [ ] Run `npm run lint` and `npm run build` locally before each deploy

---

## 13. What Stays the Same (Core Platform)

These components **do not change** per client — they are the reusable platform:

| Layer | What It Provides |
|-------|------------------|
| **Frontend Core** | React Router, Zustand stores, i18n system, theme system, API client, PWA/SW, build pipeline |
| **Admin Panel** | Catalog CRUD/import/zen mode, orders dashboard, services inbox, users, settings, AI providers, brands, promo hub, chatbot administration (knowledge base, FAQs, analytics), command palette |
| **Chatbot** | Deterministic-first engine (FAQ, catalog, orders, cart, repair, skills), AI fallback chain, Vectorize semantic search, Turnstile protection, analytics |
| **Worker Platform** | Auth (JWT, Google, GitHub), D1/KV/R2 bindings, conversations inbox (WhatsApp + email), Web Push, Mercado Pago Checkout Bricks, AI provider chain, scheduled tasks |
| **Infrastructure** | Build ID cache invalidation, edge headers, service worker versioning, R2 asset serving, Cloudflare Pages + Worker deployment |

---

## 14. Files That Are **Client-Specific** (Must Replace/Fork)

```
src/
├── config/
│   ├── brand.ts              # ← Company name, tagline, colors, fonts
│   ├── env.ts                # ← VITE_* fallbacks (reference only)
│   ├── serviceDevices.ts     # ← Repair categories & brands
│   └── theme.ts              # ← Theme names (keep or extend)
├── i18n/
│   ├── es.ts                 # ← ALL Spanish strings
│   └── en.ts                 # ← ALL English strings
├── assets/                   # ← Hero image, etc.
public/
├── logos/
│   └── brands/               # ← Wordlogo, brand strip logos
├── favicon/                  # ← All favicon variants (PNG for iOS)
├── videos/                   # ← Hero video + poster
├── _headers                  # ← Cache headers (keep same)
├── _redirects                # ← SPA fallback (keep same)
index.html                    # ← Title, meta, OG tags, manifest link
vite.config.ts                # ← PWA manifest, cache IDs, asset patterns
worker/
├── wrangler.toml             # ← Worker name, bindings, domains, vars
.env.production               # ← Reference for Pages env vars (tracked)
```

---

## 15. Skills System (Chatbot Knowledge Base)

If the new client wants the AI chatbot:

1. **Create skills D1**: `wrangler d1 create newbusiness-skills`
2. **Run migrations**: `cd worker && npm run migrate:skills` (applies `skills-migrations/`)
3. **Add knowledge docs** in `docs/features/`, `docs/policies/`, `docs/guide/`, `docs/admin/`
4. **Sync to D1**: `./scripts/skills.sh push docs/features` (and other dirs)
5. **Configure AI providers** in `/admin` → **IA** tab (priority per capability)
6. **Set Worker secrets** for AI provider API keys

> **Auto-translation**: Write English `.md` only. Monday 02:00 UTC cron translates to Spanish in D1. Do not commit Spanish translations.

---

## 16. Brand Compliance Checklist (Enforced by `npm run lint`)

- [ ] All display mentions read `NEW BUSINESS S.A.` (never bare "NEW BUSINESS")
- [ ] `public/logos/brands/wordlogo.png` renders the full name
- [ ] `Logo` component used for decorative brand mentions
- [ ] No runtime string reconstruction of brand name
- [ ] `scripts/brand-check.sh` passes (checks `src/`, `public/`, `index.html`, `worker/src/`, `docs/`, `tests/`)

---

## 17. Summary: Minimum Viable Rebrand

For a **fast clone** (hours, not days):

1. **Fork repo** → rename
2. **Replace brand assets**: `public/logos/brands/`, `public/favicon/`, `public/videos/`
3. **Edit 3 config files**: `src/config/brand.ts`, `index.html`, `vite.config.ts` (manifest)
4. **Update i18n**: Find/replace "TECNICELU S.A." → "NEW BUSINESS S.A." in `es.ts`/`en.ts`
5. **Create Worker resources**: D1, KV, R2, Vectorize, secrets
6. **Deploy Worker** with new `wrangler.toml`
7. **Deploy Frontend** to Pages with new `VITE_*` vars + custom domain
8. **Configure via Admin**: `/admin` → **Ajustes** (all runtime settings)
9. **Load products** via **Productos** tab (CSV import or manual)

---
 
## 18. Infrastructure Strategy: Demos vs. Production Clients
 
### 18.1 The Core Decision: Complete Separation for Production
 
**Every production client gets their own Cloudflare account (or account + zone) with fully isolated resources:**
 
| Resource | Production Client | Why Separate |
|----------|-------------------|--------------|
| **D1 (main)** | `clientname` | Customer data, orders, products, settings — legal isolation |
| **D1 (skills)** | `clientname-skills` | Chatbot knowledge base, FAQ embeddings |
| **KV (sessions)** | `clientname-sessions` | User auth tokens, no cross-client leakage |
| **KV (catalog)** | `clientname-catalog` | Product cache, build-ID invalidation per client |
| **R2 (assets)** | `clientname-assets` | Product images, brand logos — bandwidth/quotas isolated |
| **R2 (media)** | `clientname-media` | Demo videos, admin recordings |
| **Vectorize** | `clientname-skills-semantic` | Semantic search index per client |
| **Worker** | `clientname` | Own secrets, env vars, custom domain (`api.clientname.store`) |
| **Pages** | `clientname` | Own custom domain (`clientname.store`), build config |
| **Email Routing** | `clientname.store` | Inbound email → conversations inbox |
| **Turnstile** | Per-client site keys | Bot protection scoped to domain |
| **VAPID** | Per-client keys | Push subscriptions tied to public key |
| **OAuth Apps** | Per-client Google/GitHub/MP | Credentials never shared |
 
> **Rule**: No shared D1/KV/R2/Worker/Pages between production clients. Ever. The marginal cost (~$5-15/mo per client on Cloudflare) is negligible compared to data isolation, security, and operational simplicity.
 
### 18.2 Quick Demo Strategy: "Template Instance" on Shared Infra
 
For **pre-sales demos, prototypes, and internal validation** — before a client commits — you can spin up a lightweight **template instance** on your existing TECNICELU Cloudflare account:
 
#### Option A: Subdomain Demo (Fastest, ~10 min)
```bash
# 1. Create demo D1 databases (prefixed, not replacing production)
wrangler d1 create demo-clientname
wrangler d1 create demo-clientname-skills

# 2. Create demo KV namespaces
wrangler kv:namespace create "demo-clientname-sessions"
wrangler kv:namespace create "demo-clientname-catalog"

# 3. Create demo R2 buckets
wrangler r2 bucket create demo-clientname-assets
wrangler r2 bucket create demo-clientname-media

# 4. Deploy Worker to demo subdomain
# In wrangler.toml, add [env.demo] with demo bindings
# Deploy: wrangler deploy --env demo
# → Available at: demo-clientname.api.tecnicelu.store
 
# 5. Deploy Frontend to Pages preview
# Create Pages project "demo-clientname" connected to same repo
# Set VITE_API_BASE=https://demo-clientname.api.tecnicelu.store
# → Available at: demo-clientname.tecnicelu.pages.dev
```
 
**Pros**: Uses your existing Cloudflare account, no new DNS, instant cleanup
**Cons**: Shares your account quotas; demo URLs look like `demo-xyz.tecnicelu.pages.dev`
 
#### Option B: Custom Domain Demo (More Realistic, ~30 min)
If you own a "demo" domain (e.g., `demostore.co`):
```bash
# Add custom domain to Pages project: demo-clientname.demostore.co
# Add Worker route: api-demo-clientname.demostore.co
# Configure OAuth redirect URIs for demo domain
# Use sandbox Mercado Pago credentials
```
 
**Pros**: Client sees their brand on a clean domain; realistic PWA install
**Cons**: Requires demo domain + DNS management
 
#### Demo Data Seeding (Both Options)
```bash
# Apply migrations to demo D1
cd worker
wrangler d1 migrations apply demo-clientname --remote
wrangler d1 migrations apply demo-clientname-skills --remote

# Seed with sample products (use admin import or script)
# Admin → Productos → Import folder of images → creates hidden $0 drafts
# Edit a few to publish with real prices
# Configure /admin → Ajustes with demo WhatsApp, shipping, etc.
```
 
> **Cleanup**: `wrangler d1 delete demo-clientname`, `wrangler kv:namespace delete`, `wrangler r2 bucket delete` — all scriptable.
 
### 18.3 "Template Instance" Repo Pattern (Recommended)
 
Create a **dedicated template repo** (not a branch) that represents a **clean, parameterized baseline** — no TECNICELU-specific data:
 
```
template-storefront/
├── src/
│   ├── config/
│   │   ├── brand.ts              # ← PLACEHOLDER values + comments
│   │   ├── env.ts                # ← VITE_* with clear placeholder comments
│   │   ├── serviceDevices.ts     # ← Generic categories (computers, phones, tablets)
│   │   └── theme.ts
│   ├── i18n/
│   │   ├── es.ts                 # ← Generic strings, {{COMPANY}} placeholders
│   │   └── en.ts
│   └── assets/
├── public/
│   ├── logos/brands/             # ← Placeholder wordlogo.svg (editable)
│   ├── favicon/                  # ← Generic favicon set
│   └── videos/                   # ← Placeholder poster only
├── index.html                    # ← {{COMPANY}} placeholders in title/meta
├── vite.config.ts                # ← Manifest with {{COMPANY}} placeholders
├── worker/
│   ├── wrangler.toml             # ← Template with {{CLIENT_NAME}} placeholders
│   └── src/                      # ← Shared worker code (NO client config)
├── scripts/
│   └── init-client.mjs           # ← Automation: replace placeholders → create client repo
├── .github/workflows/            # ← CI for template validation only
└── README.md                     # ← "How to instantiate a client from this template"
```
 
#### Instantiation Script (`scripts/init-client.mjs`)
```javascript
// Usage: node scripts/init-client.mjs "New Business" "newbusiness" "newbusiness.store"
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const [, , companyName, clientSlug, domain] = process.argv;
// 1. Clone template to new dir
// 2. Replace placeholders: {{COMPANY}} → companyName, {{CLIENT_SLUG}} → clientSlug, {{DOMAIN}} → domain
// 3. Generate VAPID keys (node scripts/setup-vapid-secrets.mjs)
// 4. Create Cloudflare resources via API (wrangler or Cloudflare API)
// 5. Git init + commit + push to new client repo (or create repo via GitHub API)
// 6. Output: "Client repo ready at github.com/yourorg/newbusiness — deploy steps:"
```
 
**Result**: One command → new client repo + Cloudflare resources created + first deploy triggered.
 
### 18.4 Decision Matrix: Which Approach When?
 
| Scenario | Approach | Time | Infra Cost |
|----------|----------|------|------------|
| Internal PoC / team validation | Option A (subdomain demo) | 10 min | $0 (your account) |
| Live demo to prospect (screen share) | Option A + seeded data | 20 min | $0 |
| Prospect wants to "try it themselves" for a week | Option B (custom demo domain) | 30 min | $0-5 |
| Prospect signs → production build | Template Instance → new Cloudflare account | 1-2 hrs | $5-15/mo |
| You onboard 5+ clients/year | Option A (Monorepo) + Template Instance | Setup: 1 day | Per-client |
| You want zero ops per client | Option B (Fork) + Template Instance | Per client: 2 hrs | Per-client |
 
### 18.5 What NEVER Goes in a Demo/Template Instance
 
- ❌ Production Mercado Pago credentials (use sandbox only)
- ❌ Real WhatsApp Business API credentials (use test number or skip)
- ❌ Real VAPID keys (generate throwaway pair)
- ❌ Real GitHub/GitHub Issues tokens (use demo PAT or omit)
- ❌ Real Google OAuth client secret (use demo project)
- ❌ Any TECNICELU-specific data (products, orders, conversations)
- ❌ `GITHUB_ADMIN_ORG` pointing to your org (use demo org or disable GitHub admin)
 
> **Security**: Demo instances are publicly accessible. Treat them as untrusted. Rotate any secrets used after demo ends.
 
### 18.6 Production Client Onboarding Checklist (From Template Instance)
 
When a prospect converts to a paying client:
 
1. **Client creates Cloudflare account** (or you create under your agency account with them as member)
2. **Run instantiation script** against *their* Cloudflare account (API tokens with scoped permissions)
3. **Transfer domain** to their Cloudflare (or add as custom domain in their Pages/Worker)
4. **Client provides**: Mercado Pago prod credentials, WhatsApp Business API access, Google OAuth, GitHub org
5. **You set secrets** in their Worker via `wrangler secret put` (or they do it)
6. **Configure Admin** → **Ajustes** with their real business data
7. **Import real catalog** via **Productos** tab
8. **Go live** — DNS cutover to their domain
9. **Demo instance** → schedule deletion
 
---
 
## 19. Support & Maintenance
 
- **Core updates**: Fix in template → propagate to client forks (Option B) or update core package (Option A)
- **Client-specific changes**: Only touch files in Section 14
- **Shared Worker logic**: Keep in `worker/src/` — do not fork per client unless behavior diverges
- **Database migrations**: Run per-client D1 via `wrangler d1 migrations apply`
 
---
 
*This guide reflects the architecture as of the current shipped version. See `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, and `docs/deployment.md` for deeper technical details.*