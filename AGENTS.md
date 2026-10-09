# AGENTS

## Branding Standard

- **Every display mention of the company must read `TECNICELU S.A.`** — never bare "TECNICELU". This applies to all UI strings (i18n + JSX), document titles, PWA manifest, push notifications, WhatsApp bodies, email/newsletter content, chatbot replies, the knowledge base (`docs/policies/`, `docs/guide/`, `docs/features/`), and internal docs. Technical identifiers that **stay as-is** (they are not display text): lowercase `tecnicelu.store` / `api.tecnicelu.store` / `@tecnicelu.store` domains, Worker name `tecnicelu`, and file paths like `logos/tecnicelu.png`.
- **First-party brand marks exist in two places on purpose.** The repo copy under `public/` is what the storefront serves and what ships with a deploy; the R2 copy under `brand-assets/` is the durable one, uploaded via Admin -> Promo -> Brand assets (that endpoint writes through the Worker's `MEDIA_BUCKET` binding, which is the only R2 write path that works — the `wrangler r2 object put` CLI cannot write to `tecinicelu-media`/`tecinicelu-assets`, it fails with "The specified bucket does not exist" even though `r2 bucket list` shows them). Uploads always keep the operator's own filename (no timestamp prefix), and the `promo_brand_assets` list upserts by path so re-uploading one name replaces it instead of appending a duplicate row — the endpoint returns 201 for a new asset and 200 for a replace. Canonical names, both 1024x1024 and both existing as WebP (storefront) + PNG (fallback and social/OG):
  - `brand-mark-avatar.webp` / `.png` — the circular phone+gear mark alone, no text. Used for the favicon, PWA/app icons, header avatar, chat watermark, and the default `phone_logo` setting.
  - `brand-mark-with-wordmark.webp` / `.png` — the same mark with the **TECNICELU S.A.** lettering beneath it. Used for social/OG images (`og_image`, `DEFAULT_OG_IMAGE`, `index.html` meta).
  These are two different compositions, not duplicates. Keep the `.png` next to each `.webp` for OG compatibility — social crawlers do not reliably accept WebP. All four carry `max-age=31536000, immutable` via explicit `public/_headers` rules (root-level files are not covered by `/assets/*`). Migration `055_rename_brand_mark_assets.sql` repoints the stored `og_image` / `phone_logo` settings; earlier names were `logowithwords.png` and `tcphonecircle.webp`.
- **Use the wordlogo asset, not text, wherever a brand mention is decorative** (headers, footers, login wordmark, opt-in prompts, page eyebrows): `public/logos/brands/wordlogo.png` (renders "TECNICELU S.A."). The `Logo` component (`src/components/ui/Logo.tsx`) provides `wordmark`/`icon`/`both` variants. Prefer it over literal text; plain text is acceptable where an inline glyph is awkward (e.g. copyright line in the footer).
- **Do not reconstruct the name at runtime**: brand strings are written in full in `src/i18n/es.ts` and `src/i18n/en.ts`. There is no `replaceAll('TECNICELU', ...)` shim.
- Enforcement: `npm run lint` runs `scripts/brand-check.sh`, which fails if any uppercase `TECNICELU` (not followed by `S.A.`) appears in `src/`, `public/`, `index.html`, `worker/src/`, `docs/`, or `tests/`. After editing knowledge-base docs, re-sync via `./scripts/skills.sh push docs/features` (and `docs/policies`, `docs/guide`).

## Storefront Scope

This is the active TECNICELU S.A. project: React + Vite + TypeScript storefront plus its Cloudflare Worker API.

- Storefront: React components, React Router, Zustand, and `LanguageProvider` patterns already present in `src/`.
- Backend API: Cloudflare Worker lives in `worker/` (`worker/wrangler.toml`, `worker/migrations/`). All Worker deploys, secrets, and D1 migrations run from that directory. The deployed Worker is a delegation chain: `notifications-worker.js` (Web Push) → `index.js` (payments, admin-AI, `/ai/chat`) → `core-handler.js` (everything else: auth, catalog, orders, services, users, admin, email, WhatsApp webhook, cron). `core-handler.js` is the main handler and is NOT dead code — put new routes there unless they touch a domain `index.js` already owns; folding it into `index.js` is deferred (see `docs/ARCHITECTURE.md` → "Worker Entry Points"). Session/JWT code lives in `worker/src/auth.js` and the allowed-origin list in `worker/src/cors.js` — import from those rather than reaching into the handler, which is what used to make the module graph cyclic.
- Product catalog: **D1 is the source of truth** (`products` table). The Worker serves `GET /products` publicly from a KV-cached snapshot (`CATALOG_KV`, 5-min TTL, invalidated on every admin write), and the admin panel at `/admin` creates/edits/hides/deletes products live through `/admin/products*`. The storefront fetches `${VITE_API_BASE}/products` via `productStore` (the old static `public/products.json` was removed). Product images live on **R2** (`tecnicelu-assets` bucket, custom domain `assets.tecnicelu.store`): the admin product forms upload images via `POST /upload` (admin JWT, validates type/size, stores as `products/<category>/<uuid>.<ext>` with a public immutable object) through `apiUploadImage` (`src/lib/api.ts`). Legacy `public/productos/` files were migrated to R2; do not add new static product images there. `GITHUB_TOKEN` is not used by the upload endpoint.
- Admin panel (`/admin`) tabs: **Productos** (CRUD, drag-drop images *or whole folders* — folder imports create hidden $0 drafts; the folder picker uses its top-level folder as the category, while dropping a containing folder uses each direct child folder as a category and ignores deeper paths; see [docs/ADMIN_PRODUCT_IMPORT.md](./docs/ADMIN_PRODUCT_IMPORT.md) — catalog list/grid views with per-card editing, status filters, sorting, scheduled discounts via `discount_price`/`discount_ends_at`). The catalog tab debounced-autosaves each card (2 s idle or on blur, never mid-keystroke, skipped for invalid cards) **plus** per-card save and a "Guardar todo" bar for anything that stays unsaved; it tracks dirty cards via panel-level drafts, guards `beforeunload`, and recovers unsaved drafts from `sessionStorage` when switching panels or reloading — see [docs/ADMIN_CATALOG.md](./docs/ADMIN_CATALOG.md). Badge fields were removed from catalog cards (specs stay); badges remain editable in the full Product form and the Badges tab. Sale-price fields (full form + catalog cards) use the `PriceQuicks` control (`src/components/admin/PriceQuicks.tsx`): type-to-input COP values plus a dropdown of quick standard prices, a `−`/`+` stepper with pickable step, and "Mis precios" favorites persisted in **Cloudflare D1 settings** (`reusable_prices` key, JSON array, server-validated) — shared by all admins across devices, never per-browser `localStorage` (loaded via `apiAdminGetSettings` on mount, saved via `apiAdminUpdateSettings`). Product visibility is a guarded **Listado/No listado** publish state: every transition shows a confirmation modal (listing shows the exact sale price that would go live; catalog-card toggles queue the autosave only after confirm). The storefront product card shows no category/badge/specs; the product detail page renders up to **4 key specs**. See [docs/ADMIN_PRICING_PUBLISH.md](./docs/ADMIN_PRICING_PUBLISH.md). A separate **Catálogos** tab imports a supplier PDF as a reviewable draft catalog: pdfjs renders each page in the browser, Workers AI Vision returns product candidates with normalized bounding boxes, the browser crops and uploads each card to R2, and products are created unlisted (`active = 0`) before an explicit publish. The PDF itself never reaches the Worker. `POST /admin/products/bulk` caps at **500** products per call, so the importer chunks in `BULK_CHUNK_SIZE`, a constant that must stay equal to the Worker limit — `worker/src/catalog-import.test.js` reads the limit out of the Worker and fails if they drift. The batch link is applied by a **second** call, because `sanitizeProductInput` drops `catalogBatchId`; never try to set it on the bulk insert. Publishing unlists the current catalog, archives the previous live batch, and lists the selected one in four batch-level statements. See [docs/CATALOG_PDF_IMPORT.md](./docs/CATALOG_PDF_IMPORT.md). The **Promo** tab manages three modal popup variants: product, service, and trust badges, all behind the existing promo enabled/delay/autoclose settings; service copy is D1-backed (`promo_service_*`) and each variant has an immediate preview button — see [docs/ADMIN_PROMO_POPUPS.md](./docs/ADMIN_PROMO_POPUPS.md). The **Banners** tab manages the home marquee strips (scrolling product + service marquees) — product entries come from the per-product "Promo banner" placement and the service entries are a D1-backed `service_marquee_items` list (bilingual ES/EN text, emoji, ordered, per-entry `highlighted` emphasis and optional `link`, toggled site-wide via `deals_marquee_enabled`/`service_marquee_enabled`, with a desktop/mobile live preview in the admin); the old top announcement bar was removed. **Pedidos** (order dashboard with customer info, status pipeline, per-order WhatsApp), **Servicios** (repair-request inbox), **Ajustes** (D1-backed store settings), and the promo/QR/PWA assets area. In **Brand assets** (Admin → Promo, `/admin/promo-assets`), the clickable/drag-and-drop zone uploads instantly to R2 (`brand-assets/…`, public, live immediately — no GitHub/Pages round-trip), using the file name as the asset name (renameable inline afterwards via `PATCH /admin/promo-assets/<path>`); see [docs/ADMIN_PROMO_ASSETS.md](./docs/ADMIN_PROMO_ASSETS.md).
- Admin catalog category filter is a persistent horizontal snap-scroll rail below the search bar, not a dropdown. All categories are visible at a glance; users swipe to browse. The rail uses `snap-x snap-mandatory overflow-x-auto` with `role="listbox"` and is fully scrollable without a picker toggle.
- Admin catalog zen mode is an explicit full-screen vertical price editor. Keep its interface chrome-free: the product editor cards and a single top-right `X` exit control are the only visible controls; `Escape` also exits.
- Admin navigation dock collapses to a single avatar icon with a small brand dot indicator. On mobile the dock sits at the bottom; on desktop it sits on the left. When collapsed, primary tabs, the command palette, and the products section nav all hide with a smooth 300 ms `ease-out` transition. Clicking the avatar re-expands the dock; a small `X` control inside the expanded dock collapses it. The product-section dock fades and scales down during collapse rather than snapping.
- **Command palette** (`Cmd/Ctrl+K`): global fuzzy search for any admin action (navigation, settings, product/order/service/market context actions, global). 130+ entries in `docs/admin/command-palette-data.json` with bilingual keywords (ES/EN), i18n title/description keys, category grouping, and context-aware boosting (e.g. Orders tab boosts order actions). Mobile access via 🔍 trigger in dock. Keyboard: `↑/↓` navigate, `Enter` execute, `Tab` cycle categories, `Esc` close. Source: `src/components/admin/AdminCommandPalette.tsx`, hook `useAdminCommandPalette`, search `useCommandPaletteSearch` (Fuse.js), actions `adminPaletteActions.ts`.
- Admin collaboration is separate from the deferred customer conversations inbox: `/admin?tab=team` stores admin-only D1 threads and developer-feedback reports. The site feedback overlay renders only for authenticated admins, records route/viewport/build plus deliberate `data-dev-id` values, and creates GitHub issues only through the Worker after explicit confirmation. Never expose a GitHub token to the browser; `GITHUB_ISSUES_TOKEN` is a least-privilege Worker secret. Screenshot capture remains deferred until private R2 storage is approved.
- Admin catalog chat portal: on `/admin`, `ChatWidget` is an authenticated catalog portal, not a prompt-authorized AI write path. `POST /admin/chat/catalog/search` and `PUT /admin/chat/catalog/:id` are guarded by the Worker admin JWT check; the latter accepts only `price`, `cost`, `active`, and boolean `stock`, validates with `sanitizeProductInput`, then refreshes the build-ID catalog KV snapshot. The UI must retain staged edits plus an explicit Review → Confirm step; never add auto-save, deletion, bulk edits, settings/order writes, or client/D1 direct access. Customer chat must never expose this UI or bypass Turnstile. See [docs/ADMIN_CHAT_CATALOG_PORTAL.md](./docs/ADMIN_CHAT_CATALOG_PORTAL.md).
- Store settings live in D1 (`settings` table) and override build-time defaults at runtime: `shipping_price` (replaces `lib/pricing.ts` fallback; server validates orders against it), `whatsapp_number` (used by banners, floating widget, footer, checkout confirmation), `promo_service_*` (service popup title/body/CTA), `trust_badges` (global hero/catalog/product-detail badge text + icon + style + visibility), and `phone_logo` (header avatar, favicon, chat watermark, install peek, app-download images; default `/brand-mark-avatar.webp`). Edit them in Admin → Ajustes / Productos → Promo / Badges de confianza — never hardcode. The Brand assets upload (Admin → Promo) is deliberately minimal — file + name only, no light/dark variant selector (uploads store variant `light`); per-asset "Set as phone logo" writes `phone_logo` and the Worker invalidates the `settings:v1:<buildId>` KV immediately, so the swap applies on the next page load for every visitor.
- Mercado Pago Checkout Bricks is **built and tested but NOT live in production** — as of 2026-10-02 the `tecnicelu` Worker has no `MP_ACCESS_TOKEN` / `MP_PUBLIC_KEY` / `MP_WEBHOOK_SECRET` set, so `mpConfigured()` is false and MP routes 503 while Nequi is the working method. Do not describe MP as production-live until a real payment completes end to end. Production credentials are Cloudflare Worker secrets (the three above; the webhook secret signs the `x-signature` header), the top-level Worker variable is `MERCADOPAGO_ENVIRONMENT = "production"`, and the production webhook URL is `https://api.tecnicelu.store/payments/mercadopago/webhook`. Preview remains sandbox through `[env.preview.vars]`. Never move Mercado Pago credentials into `VITE_*`, D1, frontend code, or docs; read [docs/MERCADO_PAGO.md](./docs/MERCADO_PAGO.md) before changing payment code.
- Unified conversations inbox: inbound WhatsApp (`POST /whatsapp/webhook`, Meta-verified) and inbound email (Cloudflare Email binding → `handleIncomingEmail`) persist into D1 `conversations`/`conversation_messages`/`conversation_links` (migration `045`, helper module `worker/src/conversations.js`) with provider-message dedup; `sendWhatsAppText` auto-records store outbound texts unless `opts.skipRecord` or the recipient is `WHATSAPP_ALERT_TO`. Admin → Conversaciones (`/admin/conversations*`) lists/searches/filters conversations, shows the timeline, updates status, and sends channel-aware replies (WhatsApp text / threaded email) or internal notes — provider credentials stay in the Worker. New-order notifications: `POST /orders` now also pings the store's WhatsApp (`WHATSAPP_ALERT_TO`) at creation via `sendOrderConfirmation`, not only at Mercado Pago confirmation. See [docs/CONVERSATIONS.md](./docs/CONVERSATIONS.md) and [docs/ROADMAP.md](./docs/ROADMAP.md).
- SEO / social sharing: the `og_title`, `og_description`, and `og_image` D1 settings control the default Open Graph and Twitter Card meta tags served on every page. Static fallbacks live in `index.html`. The `usePageMeta` hook (`src/lib/usePageMeta.ts`) merges D1 values as defaults, with per-page overrides taking priority. Edit via Admin → SEO y redes sociales; the admin panel shows a live link-preview card. Default image is the wordlogo (`/logos/brands/wordlogo.png`). Migration `029_settings_seo` seeds the initial values.
- Brand/bank logos: the home "Marcas que manejamos" strip renders brand logos from **Logo.dev** via `src/lib/logodev.ts` (`companyLogoUrl`, publishable key from `VITE_LOGO_DEV_TOKEN`). Always render Logo.dev images with `object-contain`, never `object-cover` (glyphs like Apple's get clipped). Some Logo.dev entries are poor black monograms that vanish on dark surfaces — Nequi and Infinix stay on static files; verify any new logo before wiring it in. See [docs/LOGO_DOT_DEV.md](./docs/LOGO_DOT_DEV.md). Product-detail payment logos (Nequi, Davivienda, Bancolombia) are **static tuned assets** in `public/logos/` — do not blindly swap them for Logo.dev.
- Analytics: the Worker exposes the authenticated admin `POST /admin/analytics` endpoint and persists events in the D1 `analytics` table. Chatbot deterministic/fallback reporting is served by `GET /admin/chatbot-analytics` and surfaced in Admin → Herramientas. Keep analytics writes non-blocking from the frontend; do not introduce a separate analytics backend or GitHub Actions workflow for this.
- Chatbot knowledge base: the Worker reads feature, policy, guide, admin, and internal-doc records from the separate `tecnicelu-skills` D1 database through `env.SKILLS`. The `dev_skills` categories are `feature`, `policy`, `guide`, `admin`, and `doc`; each synced Markdown file needs YAML `category`, `title`, `description`, `icon`, and `sort_order` frontmatter. Add new chatbot capabilities with a concise `docs/features/` document, then run `./scripts/skills.sh push docs/features`; update store policies in `docs/policies/` and push that directory. The Worker helpers are `querySkills`, `getSkillByPath`, and `searchSkills`; `/help`, `/guide`, `/skills`, and `/skills refresh` read this knowledge base. D1 content becomes bounded context for the AI fallback, so do not add speculative or stale claims. See `docs/skills/d1-knowledge-system.md`.

- **Token Efficiency:** The chatbot is deterministic-first — ~90% of queries resolved via D1/KV lookups with zero LLM tokens. Deterministic handlers cover FAQ, admin-managed D1 FAQ entries (`faq_entries`, Admin → Herramientas → `AdminFaqManager`), catalog, orders, cart, repair, alerts, direct skills, admin slash commands, and high-confidence KB title matches (`highConfidenceSkillChatReply`, emits `chat-skill-exact`). Active FAQs are matched by token/keyword first, then by precomputed Vectorize metadata after `POST /admin/faqs/reindex`; updated FAQs clear `embedding_updated_at` until reindexed. Quick-replies (welcome chips, guide, repair slots, proactive follow-ups, handoff, restock) eliminate free-text LLM calls. Deterministic hits emit `chat-deterministic-hit` analytics by intent (`GET /admin/chatbot-analytics` summarizes 30-day intent + fallback counts, surfaced in Admin → Herramientas → `AdminChatbotAnalyticsTool`) and are covered by `npm run worker:test`. The AI fallback cache is keyed by `ai-cache:v2:${stableMessageSignature}` — language + sorted unique tokens — so equivalent phrasings share entries without crossing languages. Rate limits (guest 2/token, chat 5/5min, AI 2/10min) and Turnstile gate prevent waste. Knowledge retrieval bounded: FTS ≤3 skills × 2000 chars, Vectorize stores path metadata only, no chat history in prompt. See `docs/TOKEN_EFFICIENCY.md` for priority order, implementation details, and files to modify.
- Chatbot knowledge documents are authored directly under `docs/` and synced to D1 by `./scripts/skills.sh push docs/`. There is no automatic translation job: `.es.md` variants are optional and maintained by hand, never generated.
- AI provider chain: production AI must go through the platform boundaries: chat routes use `worker/src/platform/chat-inference.js`, embedding/search/reindex paths use `worker/src/platform/embedding-inference.js`, and both delegate through `ai-legacy-adapter.js` to the shared `ai.js` orchestration layer and `ai-providers.js` provider adapters. Provider ordering, fallback, capability selection, error classification, analytics, and caching belong to the platform runtime; do not recreate them in `worker/src/index.js`. Provider assignments live in the D1 `ai_providers` setting; Worker secrets stay in Cloudflare Worker secrets only. Embeddings must be 1024-dimensional for the Vectorize index. See `docs/AI_PROVIDERS.md` before changing provider wiring.
- Push notifications: Web Push supports both normal browsers and installed PWAs through the shared service-worker/backend infrastructure. VAPID production secrets are configured with `node scripts/setup-vapid-secrets.mjs`; see [docs/PUSH_NOTIFICATIONS.md](./docs/PUSH_NOTIFICATIONS.md). Never commit VAPID private keys or other notification secrets, and do not rotate the VAPID pair casually because existing subscriptions depend on the public key.
- i18n: every UI string (admin panel included) goes through `t()` with keys added to BOTH `src/i18n/es.ts` and `src/i18n/en.ts`. WhatsApp message bodies are intentionally Spanish.
- Large catalogs: product images lazy-load; list virtualization + server pagination are deliberately deferred — adoption triggers, design, and step-by-step plan live in [docs/VIRTUALIZATION.md](./docs/VIRTUALIZATION.md). Do not add TanStack Virtual before those thresholds are hit.
- The old `/home/yepyep/TECNICONFORT .S.A/` folder is a historical snapshot kept only as a rollback reference. Never operate on it; make all changes here.
- Use semantic theme utilities defined in `tailwind.config.js` and `src/index.css`. Read `docs/STYLE_REFERENCE.md` before visual work.
- Product-detail image sizing (learned the hard way): the image card uses uniform `p-1.5` padding on all sides — keep it symmetric; never strip/zero the bottom padding to "fix space under the image". `ProductImage`'s `naturalAspect` hugs the frame to each photo's intrinsic ratio (it also checks `complete` via ref so already-cached images resolve the ratio). Perceived "space under the image" has two real causes, neither fixed by padding: (1) the product photo's own backdrop/whitespace is part of the image file — do NOT trim, crop, or background-remove product images (explicitly forbidden; the studio backdrop/shadow is content), and (2) page-level gaps like the empty column below a short image in the detail `lg:grid-cols-2` → fix those with layout/alignment (keep image and details top-aligned), never by altering card padding.
- Use Lucide for UI icons. `react-icons` is reserved for third-party brand marks such as WhatsApp.
- Buttons: always use the shared `Button` component (or `.app-btn`). The default/`primary` style is a **glassy brand-tinted CTA** — the old blue-purple gradient button is banned app-wide; do not reintroduce raw gradients on buttons.
- Reuse `ProductCard`, `CatalogCta`, `WarrantyBadge`, `ShippingBadge`, and `SupportBadge` rather than duplicating commerce or trust UI patterns.
- Preserve the Worker API contract in `src/lib/api.ts` unless backend work is explicitly requested.
- See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for system architecture, component structure, and patterns.
- See [docs/ROADMAP.md](./docs/ROADMAP.md) for the shipped-capability inventory, planned work, and accepted trade-offs before proposing new features.

## Mercado Pago — read this before touching payments

**Nequi (manual QR) is the only payment method live in production.** Mercado Pago
Checkout Bricks is fully built, hardened and tested but **not deployed** — the
`tecnicelu` Worker has no `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY` or
`MP_WEBHOOK_SECRET`, so `mpConfigured()` returns false, MP routes answer `503`,
and MP is still offered at checkout (so buyers who pick it see a failure).
Verified 2026-10-02: `wrangler secret list` → 6 secrets, none `MP_*`;
`POST /payments/mercadopago/webhook` → `503 Mercado Pago is not configured`.
**Never describe MP as production-live** until a real card completes end to end.

Everything lives in one place: `worker/src/platform/payments.js` (boundary),
`worker/src/platform/payments.test.js` (34 tests), `worker/src/index.js:263-300`
(routes). Docs: [MERCADO_PAGO.md](./docs/MERCADO_PAGO.md) (design + security),
[MERCADO_PAGO_AUDIT.md](./docs/MERCADO_PAGO_AUDIT.md) (what was fixed, what is
open), [PAYMENTS.md](./docs/PAYMENTS.md) + [ORDER_LIFECYCLE.md](./docs/ORDER_LIFECYCLE.md).

**The webhook has four gates before it writes to D1, in this order.** Do not
reorder or weaken them:
1. `x-signature` HMAC-SHA256 over `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`
   using `MP_WEBHOOK_SECRET` — note `data.id` comes from the **query string**,
   not the body. No secret in production → **fails closed with 503**, by design.
2. Re-fetch `GET /v1/payments/{id}` server-to-server — in *every* environment.
   The webhook body is attacker-controlled and is never the source of truth.
3. Match `external_reference`, `amount` and `currency_id` against
   `payment_attempts`; a mismatch changes nothing.
4. Reject superseded attempts whose reference ≠ `orders.payment_reference`.

`APPROVED`/`PROCESSED`/`ACCREDITED` → `processing` + one confirmation email. Every documented MP status is classified — `failed`/`expired`/`canceled` are terminal failures and `charged_back`/`action_required`/`in_review` never fulfill (see [MERCADO_PAGO.md](./MERCADO_PAGO.md) → Status Screen Brick).

**Non-approved payments render the Status Screen Brick**
(`MercadoPagoStatusScreen.tsx`) — the only supported way to complete a 3DS
challenge, which is rejected if not started within 30s. 3DS is on
(`three_d_secure_mode: 'optional'`, `binary_mode: false`).
`REFUNDED` → `cancelled` (already excluded from the revenue query) + one
customer notice. A **partial** refund stays `processing` (the buyer paid, so it
ships) with `payment_status='PARTIALLY_REFUNDED'` and the shortfall in
`orders.refunded_total` (migration `054`) — fulfilment and money are separate
columns so neither has to lie about the other. Disputes (`IN_MEDIATION`, `CHARGEBACK`) are recorded but never
fulfill. Saved cards are **out of scope by decision** — no `customer`, no Wallet
Brick; `orders.mp_customer_id` is intentionally unused, don't build on it.

**Getting access:** prefer a **collaborator invite** over sharing tokens — *Your account → Manage collaborators*. `Manage integrations` is the only tier that can read production credentials, and the owner keeps control of revoking/renewing them without you. Client-facing Spanish walkthrough: [docs/MERCADO_PAGO_COLLABORATOR.es.md](./docs/MERCADO_PAGO_COLLABORATOR.es.md). Technical reference: [docs/MERCADO_PAGO_COLLABORATOR.md](./docs/MERCADO_PAGO_COLLABORATOR.md). `MP_WEBHOOK_SECRET` is not covered by any permission tier — it is always a manual copy.

**To activate (all four, in order):**
```bash
cd worker
npx wrangler d1 migrations apply tecnicelu --remote   # 054: refunded_total/refunded_at
npx wrangler secret put MP_ACCESS_TOKEN    # APP_USR-… from Production credentials
npx wrangler secret put MP_PUBLIC_KEY
npx wrangler secret put MP_WEBHOOK_SECRET  # panel → Webhooks → Configure notification
npm run deploy   # ← required; secrets alone do not ship the code
```
Then verify with one real card. The webhook **fails closed (503)** until the
third secret exists, so a 503 before that step is expected, not a regression.

**Mercado Pago MCP** is registered (`mcp_servers.mercadopago`, remote
`https://mcp.mercadopago.com/mcp`, OAuth) but **not authorized** — `hermes mcp
login mercadopago` needs interactive account access, then restart Hermes (no
hot-reload). Once authorized: `get_credentials` returns prod+sandbox Access Token
and Public Key; **`MP_WEBHOOK_SECRET` is not available via MCP**; `simulate_webhook`
tests the signature path before a live card; `quality_evaluation` scores a real
`payment_id` against MP's checklist; `create_test_user` unblocks
`scripts/mp-e2e.mjs` (needs a gitignored `.env.mp`).

**Testing rule:** any new safety rule in `payments.js` needs a test in
`payments.test.js` that *fails when the rule is removed* — assert on the SQL or
branch under test rather than re-implementing it in the D1 double, or the test
passes vacuously. That mistake was made and caught twice here.

## Validation


```bash
npm run build
npm run lint
```

See [docs/BUILD.md](./docs/BUILD.md) for detailed build procedures and troubleshooting.

Admin-managed chatbot FAQs are documented in [docs/ADMIN_FAQ_MANAGER.md](./docs/ADMIN_FAQ_MANAGER.md). Schema lives in migration `046_faq_entries`; after FAQ edits, use Admin → Herramientas → Reindexar FAQs to refresh Vectorize metadata.

Chatbot demo tests live in `tests/chatbot/`; deploy the isolated preview with `npm run deploy:preview` before running the mobile visual walkthrough with `./scripts/demo.sh` or the single full WebM recording with `npm run demo:video` (output: `tests/chatbot/videos/full-walkthrough.webm`). Keep `ChatWidget` interactive elements covered by the documented `data-testid` selectors, add a scenario to `tests/chatbot/chatbot-demo.spec.ts` for each customer-visible chatbot feature, document it in `docs/CHATBOT_CAPABILITIES.md`, and never use Turnstile test keys in production.

Use a bounded `npm run dev` startup when changing runtime behavior.

## Mobile-First Quality

Every change must be reviewed on narrow mobile layouts as well as desktop. Check responsive layout, touch-target size, text wrapping, horizontal overflow, navigation, forms, menus, carousels, and other touch interactions before completing work.

Read `docs/cart-and-auth.md` before changing cart, checkout, login, registration, persistence, or protected-route behavior. Checkout creates orders via the Worker API (`POST /orders`) and hands off to a customer-sent WhatsApp confirmation; see the pipeline and caveats in that doc.

Auth supports email+password, production Google OIDC, and hidden GitHub developer/admin access: tap the `/login` wordmark five times to reveal GitHub, where only `GITHUB_ADMIN_ORG` membership can issue an admin JWT. Google uses `https://api.tecnicelu.store/auth/google/callback`; its public client ID is versioned in `worker/wrangler.toml` and its secret is only a Cloudflare Worker secret. The new-account Google flow was verified on 2026-08-30; retain the existing-email link test after any auth change. WhatsApp OTP is scaffolded but disabled until its Meta Cloud API sender, approved template, Worker secrets, and migration `022` are ready. OTP verification is never marketing consent; do not auto-add verified numbers to promo lists or link an existing email account solely from a phone-login form. Read [docs/AUTHENTICATION.md](./docs/AUTHENTICATION.md) plus [docs/WHATSAPP_CLOUD_API.md](./docs/WHATSAPP_CLOUD_API.md) before changing any provider. OAuth/Meta secrets only belong in Cloudflare Worker secrets, never `VITE_*` or git.

## Cloudflare First — Deployment and Backend

**Cloudflare is the source of truth for deployment. Do not default to GitHub Actions.** Before making deployment or infrastructure changes, read `docs/cloudflare/README.md` and the relevant operations/deployment documentation.

- **Frontend:** Cloudflare Pages project `tecnicelu`; production site `tecnicelu.store`; build output `dist/`.
- **Frontend deployment:** normal frontend changes are delivered by the existing Cloudflare Pages integration from `main`. Do not add or depend on a GitHub Actions deployment workflow unless explicitly authorized.
- **Pushed = deploying. Do not babysit builds.** Any push to `main` auto-deploys via the Cloudflare Pages integration. Never poll/wait/watch the preview or production URL to confirm a deploy finished, and never run long `curl` retry loops checking whether an asset went live — the user checks those. If you need to verify a deployed asset, make it a single one-shot request (or nothing) after the user confirms the deploy; do not loop. (Note: `.gitignore`'d builds aside, Cloudflare Pages builds can lag a few minutes, but that is the integration's job to reach live, not yours.)
- **Worker:** the API Worker is deployed with **Wrangler from `worker/`**. Use the repository's existing Wrangler scripts/configuration; do not replace this with GitHub Actions.
- **R2 media/video caching:** repo-hosted videos under `public/videos/` are covered by Pages `_headers`, but videos served from R2 or an R2 custom domain need cache behavior configured on the Cloudflare side (custom domain/cache rules/headers, and CORS if cross-origin). Do not try to fix R2 video caching only in React. Point Cloudflare/API automation at the R2 bucket/custom domain and ensure public video objects return long-lived `Cache-Control` where appropriate, plus correct `Content-Type` such as `video/webm` or `video/mp4`.
- **Worker identity — there is only `tecnicelu`.** The repository root intentionally has **no** Wrangler config (`wrangler.toml`/`wrangler.jsonc`) and must never get one. Always run Worker deploys as `npm run worker:deploy` (from the root) or `npm run deploy` in `worker/` — both pass `--config wrangler.toml`. A bare `wrangler deploy`/`wrangler dev` from the repo root is fail-closed by design (no config → command errors out). Do not reintroduce `@cloudflare/vite-plugin`, a root Wrangler config, or any Worker/Pages identity named `tecniconfort-react`: that project was deleted and must stay deleted.
- **D1:** schema changes and migrations are handled with Wrangler/D1 from `worker/` using the existing migration workflow. Never make ad-hoc production database changes when a migration is appropriate.
- **Secrets and Worker bindings:** manage them through the existing Cloudflare/Wrangler setup. Never commit secret values, tokens, or credentials.
- **CORS:** Worker CORS is backend configuration. Do not modify allowed origins merely to make a frontend preview work unless the backend change is explicitly authorized. The frontend sends `X-Build-Id` on every API request, so every allowed cross-origin Worker response must include `Content-Type, Authorization, X-Build-Id` in `Access-Control-Allow-Headers`; without it browser preflights fail and error-swallowing UI can incorrectly appear empty (fixed in `ef2237e`).
- **DNS:** Cloudflare DNS is production infrastructure. Do not change DNS without explicit authorization.
- **Wrangler is for Cloudflare backend operations only:** Worker deploys, D1 migrations, and other explicitly authorized Cloudflare backend tasks. It is not the frontend deployment mechanism.
- **GitHub Actions:** do not create, enable, or rely on GitHub Actions for deployment, Worker publishing, D1 migrations, or other Cloudflare infrastructure unless the user explicitly requests and authorizes that architecture change.
- `VITE_*` values are public build-time configuration, never secrets.
- MIME/`text/html` errors on hashed assets after a deploy = edge cache poisoning from a deploy race; the `_redirects` 404 rule prevents recurrence. Recovery (zone purge + browser cleanup) is documented in `docs/cloudflare/operations.md`.
- Production approval and rollback procedures are documented in the Cloudflare docs. A Pages rollback does not roll back Worker code, D1 data, DNS, or Worker environment values.

Vercel is a future alternate-hosting branch. Do not deploy this branch to Vercel or change its DNS configuration.

## Bulletproof Cache Invalidation — Always Fresh, Zero User Action

Every deploy must reach every user instantly without manual refreshes. Four coordinated layers guarantee this:

### 1. Deploy-Time Build ID (`BUILD_ID`)
- Injected at build into `index.html` as `<meta name="build-id" content="<timestamp>">` via `vite.config.ts` plugin
- Client reads it and sends `x-build-id` header on **every** API request (`src/lib/api.ts`)
- Worker keys KV cache by this header: `catalog:v1:<buildId>` and `settings:v1:<buildId>`
- New deploy = new timestamp = immediate cache miss for **all** users → fresh catalog/settings

### 2. Edge Cache Headers (`public/_headers`)
```
HTML/manifest:    Cache-Control: public, max-age=0, must-revalidate
Hashed assets:    Cache-Control: public, max-age=31536000, immutable
```
- Entry point (`index.html`) never cached stale at edge
- Hashed JS/CSS/fonts/images: safe long-term cache; new filenames each build

### 3. Service Worker (`vite.config.ts` Workbox config)
```js
cacheId: `tecnicelu-static-${BUILD_ID}`, // build-versioned precache
registerType: 'prompt',               // no auto-skip; user controls activation
clientsClaim: true,                   // take control once activated
cleanupOutdatedCaches: true,          // purge older build caches on activate
```
- The precache cache is scoped per build (`tecnicelu-static-<BUILD_ID>-precache-*`), so a new deploy never mixes assets across versions; `cleanupOutdatedCaches` deletes older build caches on activation.
- The service worker does **not** call `skipWaiting()` on install. It listens for `{type:'SKIP_WAITING'}` instead. The app (via `src/hooks/usePwaUpdate.ts` + `PwaUpdateBanner`) detects the waiting SW and shows a non-disruptive "Nueva versión disponible — Actualizar" banner; clicking it posts `SKIP_WAITING`, waits for `controllerchange`, then reloads. No destructive reload happens mid-session.
- **Hard rule: keep `registerType: 'prompt'`.** `registerType: 'autoUpdate'` makes vite-plugin-pwa force `skipWaiting` + `clientsClaim` regardless of the workbox options, so the new SW activates silently and the update banner can never fire — once regressed, users silently run on old caches with no banner. Any config that removes the `SKIP_WAITING` listener (checked after build in `dist/sw.js`) is a regression.
- **Hard rule: iOS requires PNG icons.** Keep PNG icons in the manifest (`/favicon/apple-touch-icon.png`, `icon-192.png`, `icon-512.png`) and a PNG `apple-touch-icon` in `index.html`. iOS Safari ignores webp-only manifests and webp `apple-touch-icon` links, making iPhones non-installable. Webp is additive for Android/Chrome only.
- `importScripts('/push-sw.js')` keeps Web Push working from the same service worker.

### 4. Admin Write-Through Invalidation
- Any admin mutation (`/admin/products*`, `/admin/settings`, `/admin/brands*`) calls `refreshCatalog(env, buildId)` and invalidates `settings:v1:<buildId>`
- Combined with build-id keying, this is idempotent and instant

### Result
- **No user ever sees stale UI** — catalog, settings, components, CSS, JS, images all sync on deploy (a new build becomes current; the banner lets users apply it on their terms without data loss)
- **No `?v=` params, no hard-refresh instructions, no service-worker unregister scripts**
- Works for normal browsers, PWAs, and installed PWAs identically

## PWA Install & Update Troubleshooting

Fixes and gotchas for install/update issues across platforms; full details in `docs/PWA.md` → "Troubleshooting" (`docs/PWA.es.md` in Spanish):

- **Install button does nothing (Brave/Chrome/Edge/Android):** the modal's install action requires a captured `beforeinstallprompt`. It only fires once installability heuristics (HTTPS, valid manifest with PNG icons, active SW, engagement) are met — not on first visit — and Brave Shields/privacy configs can suppress it entirely. The `install()` handler swallows `prompt()` rejections in a `finally`, so failure looks like "nothing happened". Fallback: browser menu → address-bar install icon / "Install app" / "Add to Home Screen". Diagnose via `window.addEventListener('beforeinstallprompt', ...)` in the Console.
- **iPhone won't install or shows a blank icon:** iOS has no `beforeinstallprompt` (always Share → "Add to Home Screen") and **requires PNG** manifest icons + a PNG `apple-touch-icon`. See the iOS hard rule above.
- **Update banner never appears:** the SW must wait for the new version. `registerType` must stay `'prompt'` (see hard rule above) — `'autoUpdate'` silently auto-activates and the banner can never fire.
- After build, grep `dist/sw.js` for `"SKIP_WAITING"` to confirm the waiting listener survived, and confirm `dist/manifest.webmanifest` lists PNG icons.
