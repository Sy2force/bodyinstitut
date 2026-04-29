# Body Institut — Premium Conversion Micro-Site + CRM

Apple-grade marketing site, intelligent simulator, automated lead pipeline, and a built-in admin CRM.

## ✦ Stack

- **Next.js 14** (App Router) · TypeScript · React 18
- **Tailwind CSS** · **Framer Motion** · Lucide
- **better-sqlite3** for the leads database (file-based, zero-config)
- **nodemailer** for transactional email
- **zod** for input validation
- **OpenAI** (optional) for personalized analysis

## ✦ Features

### Public site
- Cinematic hero with parallax Ken Burns carousel
- Apple product-card simulator selection (3D tilt + dynamic glow)
- 6-step smart simulator → server-computed recommendation + AI analysis
- Result page with evolution chart + before/after silhouette
- Lead capture form with honeypot anti-spam

### Lead pipeline (`POST /api/leads`)
1. Rate-limit (5 req/min/IP, sliding window)
2. Zod validation (incl. honeypot)
3. Server-side recommendation engine (`lib/recommend.ts`)
4. AI analysis (OpenAI or rule-based fallback)
5. Insert into SQLite (`data/bodyinstitut.db`)
6. Fire-and-forget confirmation email (HTML + text)

### Admin CRM (`/admin`)
- Discreet entry point in footer (`·` after the tagline)
- Login with HMAC-signed HTTP-only cookie (`/admin/login`)
- Dashboard with **stats** (total, 7-day, converted, pipeline €)
- Searchable, filterable, sortable leads table
- Status switcher per lead (`nouveau → contacté → converti → perdu`)
- Lead drawer with full simulation context + AI analysis
- One-click **CSV export** (filtered)
- **CSV / JSON import** with per-row validation
- Delete with confirm

## ✦ Security

- HMAC-SHA256 signed sessions (edge-compatible, stateless)
- HTTP-only, SameSite=Lax cookies (Secure in prod)
- Edge middleware protects `/admin/*` and `/api/admin/*`
- Timing-safe credential comparison
- Rate limiting on `/api/leads` and `/api/admin/login`
- Zod validation on all writeable endpoints
- Honeypot field (`company`) on the lead form
- Server recomputes the recommendation — never trusts the client
- `data/bodyinstitut.db` is git-ignored

## ✦ Get started

```bash
npm install
cp .env.example .env.local        # then edit values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
Default admin: `admin` / `bodyinstitut` (CHANGE BEFORE DEPLOYING).

### Production

```bash
npm run build
npm start
```

## ✦ Configuration (env)

| Variable | Purpose | Default |
|---|---|---|
| `ADMIN_USERNAME` | Admin login | `admin` |
| `ADMIN_PASSWORD` | Admin password | `bodyinstitut` |
| `AUTH_SECRET` | Cookie HMAC key (32+ chars) | derived from password |
| `BOOKING_URL` | Planity link in email + success screen | `https://www.planity.com` |
| `BRAND_NAME` | Brand label in email | `Body Institut` |
| `BRAND_REPLY_TO` | Reply-to address | `contact@bodyinstitut.fr` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Outgoing SMTP | unset → console-log only |
| `OPENAI_API_KEY` | Use OpenAI for AI analysis | unset → rule-based |
| `OPENAI_MODEL` | OpenAI model | `gpt-4o-mini` |

## ✦ API surface

### Public
- `POST /api/leads` — Submit a simulation. Returns `{ok, id, recommendation, analysis}`.

### Admin (auth required via cookie)
- `POST /api/admin/login` — `{username, password}` → sets cookie
- `POST /api/admin/logout` → clears cookie
- `GET  /api/admin/me` → `{user}`
- `GET  /api/admin/leads?q=&status=&simulator=&minBudget=&maxBudget=&from=&to=&orderBy=&order=&limit=&offset=`
- `POST /api/admin/leads` — manual create
- `GET  /api/admin/leads/:id`
- `PATCH /api/admin/leads/:id` — `{status}`
- `DELETE /api/admin/leads/:id`
- `GET  /api/admin/leads/export?...` — streamed CSV
- `POST /api/admin/leads/import` — JSON array or CSV body

## ✦ Project structure

```
app/
  layout.tsx                    # Public shell (Navbar + Footer + ScrollProgress)
  page.tsx                      # Home
  about/page.tsx                # About
  simulator/page.tsx            # Cards
  simulator/[type]/page.tsx     # Per-device hero + flow
  admin/layout.tsx              # Bare admin shell
  admin/login/page.tsx
  admin/page.tsx                # Dashboard
  api/leads/route.ts
  api/admin/login/route.ts
  api/admin/logout/route.ts
  api/admin/me/route.ts
  api/admin/leads/route.ts
  api/admin/leads/[id]/route.ts
  api/admin/leads/export/route.ts
  api/admin/leads/import/route.ts
components/
  Navbar.tsx, Footer.tsx
  HeroCarousel.tsx, ScrollProgress.tsx, MarqueeStrip.tsx
  MagneticButton.tsx, AnimatedCounter.tsx, ParallaxImage.tsx
  SimulatorCard.tsx, SimulatorFlow.tsx
  BodySilhouette.tsx, BudgetSlider.tsx, EvolutionChart.tsx
  Reveal.tsx
  admin/StatusPill.tsx
  admin/LeadDrawer.tsx
lib/
  db.ts                         # SQLite + queries
  types.ts                      # Pure shared types (client-safe)
  auth.ts                       # HMAC sessions, edge-safe
  recommend.ts                  # Pure recommendation engine
  email.ts                      # nodemailer + branded HTML template
  ai.ts                         # OpenAI / rule-based generator
  rate-limit.ts                 # In-memory sliding window
  validation.ts                 # zod schemas
  simulators.ts                 # Catalog (3 devices)
middleware.ts                   # Protects /admin/* and /api/admin/*
data/
  bodyinstitut.db               # SQLite (gitignored)
```

## ✦ Conversion principles

- One primary CTA per viewport
- Friction reduced: 5 micro-questions before a single contact form
- Server-side computation = no manipulation of budget or recommendation
- Real-time visual feedback (silhouette glow, evolution chart, animated counters)
- Apple-grade restraint: every path leads to the simulator
