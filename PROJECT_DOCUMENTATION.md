# Onik Portfolio — Project Documentation

A production-ready personal portfolio **platform**: a public React website plus a secure admin CMS, backed by an Express REST API, MongoDB and cloud file storage. All content (profile, projects, skills, experience, SEO, theme, section order…) lives in the database and is edited from the dashboard. You never need to change React code to update the portfolio.

---

## Table of contents

1. [Architecture](#1-architecture)
2. [Frontend structure](#2-frontend-structure)
3. [Backend structure](#3-backend-structure)
4. [Database collections / models](#4-database-collections--models)
5. [Authentication flow](#5-authentication-flow)
6. [API endpoints](#6-api-endpoints)
7. [Admin dashboard](#7-admin-dashboard)
8. [Environment variables](#8-environment-variables)
9. [Deployment](#9-deployment)
10. [How to add / change each portfolio feature](#10-how-to-add--change-each-portfolio-feature)
11. [Which file controls each UI section](#11-which-file-controls-each-ui-section)
12. [Adding a new admin-managed feature](#12-adding-a-new-admin-managed-feature)
13. [Backup & recovery](#13-backup--recovery)
14. [Scalability recommendations](#14-scalability-recommendations)
15. [Production-readiness audit](#15-production-readiness-audit)
16. [Content provenance](#16-content-provenance)

---

## 1. Architecture

```
┌──────────────────────────┐        HTTPS (same origin)        ┌─────────────────────────────┐
│  React SPA (Vite)        │  ───── /api/* , /uploads/* ─────▶ │  Express API (Node.js)      │
│  • Public site           │                                   │  • Auth (JWT + refresh)     │
│  • Admin CMS (lazy)      │  ◀──── JSON, httpOnly cookies ─── │  • Generic CRUD registry    │
└──────────────────────────┘                                   │  • Draft/publish workflow   │
                                                               │  • Uploads (sharp → WebP)   │
                                                               │  • SEO: meta, sitemap, robots│
                                                               └───────┬──────────┬──────────┘
                                                                       │          │
                                                            ┌──────────▼───┐  ┌───▼──────────────┐
                                                            │ MongoDB      │  │ Cloudinary (CDN) │
                                                            │ (Atlas)      │  │ images + CV PDF  │
                                                            └──────────────┘  └──────────────────┘
```

Key design decisions

| Decision | Why |
|---|---|
| **Registry-driven CRUD** (`server/src/resources/registry.js` + `client/src/admin/resources.js`) | One generic router and one generic admin screen serve every collection. New content types are ~30 lines of config. |
| **Draft → Publish** for Profile & Website Settings | Edit safely, preview (`/?preview=1`), then publish atomically. Collections use a per-item *Visible* toggle (hidden items show only in Preview). |
| **Single aggregated public endpoint** (`GET /api/public/site`) | The home page needs one request. Server-side in-memory cache + ETag/304 keeps it fast and fresh. |
| **httpOnly cookie sessions** (short-lived JWT + rotating refresh token) | Tokens are never readable by JavaScript (XSS can’t steal them); sessions are revocable. |
| **Storage driver abstraction** (`local` / `cloudinary`) | Zero-config local development, CDN-backed production. |
| **Single-service deploy** (Express serves `client/dist`) | One domain → first-party cookies, no CORS, and the server injects SEO tags into `index.html` for crawlers/link previews. |
| **Section registry** (`client/src/sections/registry.js`) | Section order/visibility/titles come from the database; empty sections hide automatically. |

---

## 2. Frontend structure

```
client/
├─ index.html                 # SEO fallback block (<!-- seo:start --> … <!-- seo:end -->)
├─ public/                    # favicon.svg, theme-init.js (prevents theme flash)
├─ vite.config.js             # dev proxy (/api, /uploads → API), vendor chunking
├─ vercel.json                # only for split deployments (rewrites + headers)
└─ src/
   ├─ main.jsx                # React root, TanStack Query client, fonts, CSS
   ├─ App.jsx                 # Router: public layout, lazy pages, /admin/*, error boundary
   ├─ styles/index.css        # Design tokens (dark/light), motion system, prose styles
   ├─ lib/
   │  ├─ api.js               # fetch wrapper (cookies, CSRF header, auto-refresh)
   │  ├─ utils.js             # cn, mediaUrl, Cloudinary imageUrl/srcSet, readableOn, formatDate…
   │  └─ techIcons.js         # technology name → brand logo + colour
   ├─ hooks/                  # useSiteData, usePreview, useDocumentMeta, useTheme, useReveal
   ├─ components/
   │  ├─ layout/              # PublicLayout, Navbar, Footer, Logo, ScrollToTop,
   │  │                       # PreviewBanner, SiteSkeleton, WelcomeMascot
   │  └─ ui/                  # Button, Img, Markdown, SocialIcon, TechIcon, TechMarquee,
   │                          # CountUp, Feedback (Skeleton/Spinner/EmptyState/ErrorState)
   ├─ sections/               # One component per homepage section + registry.js
   ├─ pages/                  # Home, ProjectDetails, BlogList, BlogPost, PostCard, NotFound
   └─ admin/                  # Lazy-loaded CMS (never downloaded by normal visitors)
      ├─ AdminApp.jsx         # Admin routes
      ├─ auth.jsx             # AuthProvider + RequireAuth
      ├─ resources.js         # Declarative field config for every collection
      ├─ layout/AdminLayout.jsx   # Sidebar, top bar, Publish/Preview/Discard
      ├─ components/          # ResourceManager, SingletonForm, fields, MediaPicker,
      │                       # SectionsEditor, Dialog/Confirm, PageHeader
      └─ pages/               # Login, Overview, Profile, Contact, Settings, Media, Account, ResourcePage
```

Technologies: React 19, React Router, TanStack Query (caching, loading states), React Hook Form (validation), Tailwind CSS v4, Sonner (toasts), lucide-react + react-icons, react-markdown (safe Markdown).

Performance features: route & section code-splitting (`React.lazy`), admin bundle split from public bundle, vendor chunks, lazy images with reserved aspect ratios, Cloudinary `f_auto,q_auto` + responsive `srcset`, self-hosted variable fonts, CSS-only animations (GPU transforms), one delegated pointer listener for card spotlights, `prefers-reduced-motion` support everywhere.

---

## 3. Backend structure

```
server/
├─ .env.example
├─ src/
│  ├─ server.js               # Boot: DB connect, first-admin bootstrap, graceful shutdown
│  ├─ app.js                  # Express app: helmet/CSP, CORS, rate limits, CSRF, routes, static client
│  ├─ dev-memory.js           # Zero-setup dev: in-memory MongoDB + seed
│  ├─ config/                 # env.js (zod-validated env), db.js
│  ├─ models/                 # content.js (all collections), User, Session, Message, Media, SiteDocument
│  ├─ validators/             # common.js (safe text/url/email…), resources.js, singletons.js
│  ├─ resources/registry.js   # Collection registry (model + schema + options)
│  ├─ routes/
│  │  ├─ auth.routes.js       # login, refresh, logout, me, change-password, sessions
│  │  ├─ public.routes.js     # site, projects/:slug, posts, contact, sitemap/robots
│  │  └─ admin/               # index.js (overview, singletons, publish, media, messages) + crud.routes.js
│  ├─ middleware/             # auth (requireAdmin/optionalAdmin), security (CSRF, limits, sanitize), validate, error
│  ├─ services/               # auth, site (drafts/publish/aggregation), media (validation+sharp),
│  │                          # storage/{local,cloudinary}, seo (meta injection, sitemap), cache, mail
│  ├─ seed/                   # seed.js, data.js (CV content), create-admin.js, assets/
│  └─ utils/                  # slug, httpError
└─ tests/api.test.js          # Integration tests (node:test + supertest + in-memory MongoDB)
```

---

## 4. Database collections / models

| Collection | Model | Purpose / key fields |
|---|---|---|
| `users` | `User` | Admin account: `email`, `passwordHash` (bcrypt, 12 rounds), `tokenVersion`, `failedLogins`, `lockUntil` |
| `sessions` | `Session` | Refresh-token sessions: `tokenHash` (SHA-256), `previousTokenHash`, `expiresAt` (TTL index), `revokedAt` |
| `sitedocuments` | `SiteDocument` | Singletons `profile` and `settings`, each with `draft` + `published` copies |
| `projects` | `Project` | `title`, `slug` (unique), `shortDescription`, `description` (Markdown), `thumbnail`, `images[]`, `technologies[]`, `category`, `githubUrl`, `liveUrl`, `docsUrl`, `featured`, `completedAt` |
| `skills` | `Skill` | `name`, `category`, optional `level` |
| `experiences` | `Experience` | `type` (`work`/`internship`), `role`, `company`, dates, `current`, `description`, `highlights[]`, `technologies[]`, `logo` |
| `educations` | `Education` | `degree`, `field`, `institution`, dates, `result` |
| `researches` | `Research` | Thesis/papers: `title`, `type`, `status`, `abstract`, `url` |
| `certifications` | `Certification` | `name`, `issuer`, dates, `credentialId`, `credentialUrl`, `image` |
| `achievements` | `Achievement` | `title`, `organization`, `date`, `description` |
| `services` | `Service` | `title`, `description`, `icon` |
| `testimonials` | `Testimonial` | `name`, `role`, `company`, `quote`, `avatar` |
| `posts` | `Post` | Blog: `title`, `slug`, `excerpt`, `content` (Markdown), `coverImage`, `tags[]`, `externalUrl`, `publishedAt` |
| `sociallinks` | `SocialLink` | `platform`, `label`, `url`, `showInHero` |
| `messages` | `Message` | Contact form: `name`, `email`, `subject`, `message`, `status`, `ipHash` (HMAC, never raw IP) |
| `media` | `Media` | Uploaded files: `url`, `provider`, `key`, `kind`, `mimeType`, size, dimensions, `folder` |

Every content collection also has `order`, `isPublished`, `createdAt`, `updatedAt`.

**Profile** (singleton): name, title, headline, shortIntro, bio, careerObjective, location, availability, avatar, heroImage (transparent cut-out), resume {url, fileName, updatedAt}, highlights[], contact {email, phone, location, showEmail, showPhone, formEnabled, note}.

**Settings** (singleton): general {siteTitle, logoText, logo, favicon}, theme {primaryColor, defaultTheme, allowToggle}, hero {greeting, CTA labels, showSocials}, seo {title, description, keywords, ogImage, twitterHandle, siteUrl, indexable}, welcome {enabled, title, message, followUps, projectsMessage, contactMessage, cvMessage, thanksMessage}, footer {text, showSocials}, sections[] {key, title, eyebrow, subtitle, enabled, showInNav}.

---

## 5. Authentication flow

```
Login  POST /api/auth/login {email,password}
   ├─ rate limit (10 / 15 min / IP) + account lock after 5 failures (15 min)
   ├─ bcrypt compare (constant-time dummy compare for unknown e-mails)
   ├─ create Session { tokenHash = sha256(refresh) }
   └─ Set-Cookie: pf_access  (JWT HS256, 15 min, httpOnly, path=/api)
                  pf_refresh (random 48 bytes, 7 days, httpOnly, path=/api/auth)

Every admin request → requireAdmin
   ├─ verify JWT (issuer, audience, algorithm pinned)
   ├─ load user + session: not revoked, not expired, tokenVersion matches
   └─ else 401

Access token expired → client calls POST /api/auth/refresh (automatic, once)
   ├─ rotate refresh token (single use)
   ├─ replay of an old token after 30 s ⇒ whole session revoked (theft detection)
   └─ concurrent refresh from a 2nd tab within 30 s ⇒ accepted without new tokens

Logout → session revoked + cookies cleared
Change password → tokenVersion++ (all JWTs invalid), all sessions revoked, fresh session issued
```

CSRF protection: all state-changing `/api` requests must send `X-Requested-With: XMLHttpRequest` (forces a CORS pre-flight that only allowed origins pass) **and** a matching `Origin` when present; cookies are `SameSite=Lax` by default.

The client-side `RequireAuth` guard is only UX — **authorization is enforced on the server** for every admin endpoint (`router.use(requireAdmin)`).

---

## 6. API endpoints

All responses are JSON. Admin endpoints require the session cookie; mutating requests require the `X-Requested-With` header.

### Auth — `/api/auth`
| Method | Path | Description |
|---|---|---|
| POST | `/login` | Log in, sets cookies |
| POST | `/refresh` | Rotate refresh token (`{user:null}` if no session) |
| POST | `/logout` | Revoke current session |
| GET | `/me` | Current admin or `{user:null}` |
| POST | `/change-password` | `{currentPassword, newPassword}` |
| GET | `/sessions` | Active sessions |
| POST | `/logout-all` | Revoke all sessions |

### Public — `/api/public`
| Method | Path | Description |
|---|---|---|
| GET | `/site` | Everything for the home page (`?preview=1` for admins: drafts + hidden items) |
| GET | `/projects/:slug` | Project + prev/next |
| GET | `/posts?page=&tag=` | Paginated articles |
| GET | `/posts/:slug` | Article |
| POST | `/contact` | Contact form (rate-limited, honeypot, timing check) |
| GET | `/sitemap.xml`, `/robots.txt` | Also available at the site root |

### Admin — `/api/admin` (all require admin)
| Method | Path | Description |
|---|---|---|
| GET | `/overview` | Dashboard stats |
| GET / PATCH | `/singletons/:key` | Read / update draft (`profile`, `settings`) — PATCH deep-merges and fully re-validates |
| GET | `/publish` | Draft status |
| POST | `/publish` | Publish drafts |
| POST | `/publish/discard` | Discard drafts |
| GET / POST | `/media` | List / upload (multipart: `file`, `folder`, `purpose=image|icon|document`, `alt`) |
| PATCH / DELETE | `/media/:id` | Edit alt / delete (also removes from storage) |
| GET | `/messages?status=&page=` | Inbox |
| PATCH / DELETE | `/messages/:id` | Mark read/unread/archived, delete |
| GET | `/:resource` | List (`?q=` search, `?type=` for experience) |
| POST | `/:resource` | Create |
| GET / PATCH / DELETE | `/:resource/:id` | Read / partial update / delete |
| PUT | `/:resource/reorder` | `{ids:[…]}` sets order |

`:resource` ∈ `projects, skills, experience, education, research, certifications, achievements, services, testimonials, posts, socialLinks`.

Errors: `{ error, fields? }` with status 400/401/403/404/409/413/422/423/429/500. Validation errors (422) include per-field messages which the admin forms display inline.

---

## 7. Admin dashboard

URL: `/admin` (login at `/admin/login`).

| Page | What you can do |
|---|---|
| **Overview** | Content counts, hidden items, unread messages, publish status, quick actions |
| **Profile** | Name, title, photo caption, location, availability, profile photo, hero cut-out photo, hero intro, highlights (stats), bio (Markdown), career objective, CV upload |
| **Projects / Skills / Experience / Education / Research / Certifications / Achievements / Services / Testimonials / Blog / Social Links** | Search, add, edit (side drawer with validation), delete (confirmation), show/hide, feature (projects), reorder with ↑/↓, image upload/library, galleries, tags, Markdown preview |
| **Contact & Messages** | Public contact details + privacy toggles, contact-form on/off, inbox (read/unread/archive/delete/reply) |
| **Website Settings** | General (title, logo, favicon, welcome character, footer), Appearance (primary colour, default theme, theme toggle), Hero & CTAs, SEO, Sections (order, visibility, navigation, headings) |
| **Media Library** | Drag-and-drop uploads, filter, copy URL, delete |
| **Security** | Change password, active sessions, sign out everywhere |

Top bar: **Preview** (opens `/?preview=1` in a new tab showing drafts and hidden items), **Publish**, **Discard drafts**, live status indicator.

Draft rules
* Profile and Website Settings → saved as **draft**; visitors see them only after **Publish**.
* Collection items (projects, skills…) → saved immediately; use **Visible on website** off to keep an item as a hidden draft, check it in Preview, then switch it on.

---

## 8. Environment variables

### `server/.env` (see `server/.env.example`)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | yes | `development` / `production` |
| `PORT` | no | Default 4000 |
| `MONGODB_URI` | **yes** | MongoDB connection string (Atlas in production) |
| `JWT_SECRET` | **yes** | ≥ 32 random chars. Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `ACCESS_TOKEN_TTL_MIN` / `REFRESH_TOKEN_TTL_DAYS` | no | Defaults 15 / 7 |
| `CORS_ORIGINS` | yes (split deploy) | Comma-separated allowed browser origins |
| `COOKIE_SAMESITE` | no | `lax` (default) or `none` (frontend & API on different sites, HTTPS only) |
| `COOKIE_SECURE`, `COOKIE_DOMAIN` | no | Secure defaults to true in production |
| `TRUST_PROXY` | no | Number of proxies in front (1 for Render/Railway/Heroku) |
| `PUBLIC_SITE_URL` | yes | Your site URL (canonical/sitemap fallback) |
| `SERVE_CLIENT` | no | `true` = serve `client/dist` (single-service deploy) |
| `STORAGE_DRIVER` | yes | `cloudinary` in production, `local` for development |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` / `_FOLDER` | prod | Cloudinary credentials |
| `SMTP_*`, `MAIL_FROM`, `NOTIFY_EMAIL` | no | E-mail notification for new contact messages |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | first run | Creates the first admin (password ≥ 12 chars, upper/lower/number). Remove the password after the first login. |

### `client/.env` (see `client/.env.example`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Leave **empty** for same-origin (recommended). Set only if the API is on another origin. |
| `VITE_DEV_API_PROXY` | Dev only: where Vite proxies `/api` and `/uploads` |

No secrets are ever placed in the frontend. `.env` files are git-ignored; only `.env.example` templates are committed.

---

## 9. Deployment

### Local development

```bash
npm run install:all
cp server/.env.example server/.env    # fill JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run seed                          # CV content, photos, CV PDF, admin account
npm run dev                           # API :4000 + web :5173
```

No MongoDB installed? `npm run dev:memory` starts an in-memory database and seeds it automatically (data is lost on exit).

### Production — recommended: one service (Render/Railway/Fly) + MongoDB Atlas + Cloudinary

1. **MongoDB Atlas** – create a free M0 cluster → Database user (strong password) → Network access (allow your host’s egress IPs, or `0.0.0.0/0` with a strong password) → copy the `mongodb+srv://…` URI.
2. **Cloudinary** – create an account → Dashboard → copy *Cloud name*, *API key*, *API secret*.
3. **Render** – *New → Blueprint* → select this repository (uses `render.yaml`), then set the `sync: false` variables:
   `MONGODB_URI`, `CORS_ORIGINS=https://your-domain`, `PUBLIC_SITE_URL=https://your-domain`, `CLOUDINARY_*`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
   Build: `npm run build` · Start: `npm start` · Health check: `/api/health`.
4. On first boot the server creates the admin. Populate content either by logging in and adding it, or by running the seed once against production from your machine:
   ```bash
   # PowerShell: $env:MONGODB_URI="…"; $env:STORAGE_DRIVER="cloudinary"; … ; npm run seed
   ```
   (the seed uploads the photo, cut-out and CV to Cloudinary).
5. Log in at `https://your-domain/admin`, change your password under **Security**, then remove `ADMIN_PASSWORD` from the host.
6. In **Website Settings → SEO** set *Website URL* to your final domain and **Publish**.

### Custom domain

Render → Settings → Custom domains → add `yourdomain.com` and `www` → create the DNS records it shows (CNAME/ALIAS/A) at your registrar → HTTPS is issued automatically. Then update `CORS_ORIGINS`, `PUBLIC_SITE_URL` and **SEO → Website URL**.

### Your setup — split deployment: Vercel (frontend) + Render (API) + Atlas + Cloudinary

Follow **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** step by step. Key points: `render.yaml` deploys only `server/`
(`TRUST_PROXY=2` because requests pass Vercel's edge and Render's proxy), `client/vercel.json` proxies
`/api`, `/uploads`, `/sitemap.xml`, `/robots.txt` to Render, and `npm run migrate` (in `server/`, configured by
`.env.migrate`) copies your local content to Atlas while uploading local files to Cloudinary and rewriting their URLs.

### Alternative — split deployment (frontend on Vercel, API elsewhere)

1. Deploy the API (Render etc.) with `SERVE_CLIENT=false`.
2. In `client/vercel.json` replace `YOUR-API-HOST` with the API host. Vercel then proxies `/api`, `/uploads`, `/sitemap.xml`, `/robots.txt` — the browser still talks to one origin, so `SameSite=Lax` cookies keep working.
3. Deploy `client/` to Vercel (framework: Vite, output `dist`). Leave `VITE_API_URL` empty.
4. Set the API’s `CORS_ORIGINS` to the Vercel domain.

Trade-off: link-preview bots see the default meta tags from `index.html` (server-side SEO injection only happens in single-service mode). If you don’t use rewrites and call the API cross-site instead, set `VITE_API_URL`, `COOKIE_SAMESITE=none` and HTTPS everywhere; note that Safari blocks third-party cookies, so rewrites or a shared parent domain (`api.yourdomain.com`) are strongly preferred.

---

## 10. How to add / change each portfolio feature

| I want to… | Where |
|---|---|
| Change name, title, intro, bio, photo | Dashboard → Profile → Save draft → **Publish** |
| Use a background-removed hero photo | Profile → *Hero cut-out photo* (transparent PNG/WebP) |
| Upload a new CV | Profile → Resume / CV → Upload PDF → Publish |
| Add a project | Projects → *Add project* (thumbnail, gallery, tech, links, category, featured) |
| Reorder projects | Projects → ↑/↓ arrows (featured projects always appear first) |
| Hide a project temporarily | Projects → eye icon |
| Add skills / new skill category | Skills → *Add skill* (type a new category name to create a group). Logos are matched automatically by name (`client/src/lib/techIcons.js`). |
| Add work experience / internship | Experience → *Add* → Type *Work* or *Internship* |
| Add education, research, certifications, achievements, services, testimonials | Their pages in the sidebar — the section appears on the site automatically once it has content |
| Write a blog post | Blog → *Add article* (Markdown); use *External URL* to link to Medium/DEV |
| Edit social links | Social Links |
| Edit contact info / hide phone / disable form | Contact & Messages |
| Read contact messages | Contact & Messages → Messages (optional e-mail notifications via `SMTP_*`) |
| Change colours / default theme | Website Settings → Appearance |
| Change logo / favicon / site title / footer | Website Settings → General |
| Configure the welcome assistant (greeting, follow-up tips on/off, every tip's text) | Website Settings → General → Welcome assistant |
| Change button labels / greeting | Website Settings → Hero & CTAs |
| Change SEO / social preview image | Website Settings → SEO |
| Reorder, rename, hide sections or change navigation | Website Settings → Sections |
| Preview before publishing | Top bar → **Preview** |

---

## 11. Which file controls each UI section

| UI | File |
|---|---|
| Section order / auto-hiding | `client/src/sections/registry.js` |
| Section heading layout | `client/src/sections/SectionShell.jsx` |
| Navbar (sticky, scroll-spy, mobile menu, theme toggle) | `client/src/components/layout/Navbar.jsx` |
| Hero text, CTAs, stats, tech marquee | `client/src/sections/Hero.jsx` |
| Hero portrait (arch, glow, floating badges) | `client/src/sections/HeroPortrait.jsx` |
| Welcome assistant (robot: greeting + timed tips, rotating entrance positions) | `client/src/components/layout/WelcomeMascot.jsx` (tuning constants at the top), animations in `styles/index.css` |
| About | `client/src/sections/About.jsx` |
| Skills / Toolkit (cards + spinning tech orbit) | `client/src/sections/Skills.jsx`, `components/ui/TechOrbit.jsx` (+ `lib/techIcons.js`) |
| Work experience & internships | `client/src/sections/Experience.jsx` |
| Projects grid + filters (auto “wide featured” first card so rows never end half-empty) | `client/src/sections/Projects.jsx`, `ProjectCard.jsx` (container-query layout) |
| Project detail page | `client/src/pages/ProjectDetails.jsx` |
| Research / Education / Certifications / Achievements / Services / Testimonials | `client/src/sections/<Name>.jsx` |
| Blog section / list / article | `sections/Blog.jsx`, `pages/BlogList.jsx`, `pages/BlogPost.jsx`, `pages/PostCard.jsx` |
| Resume CTA | `client/src/sections/Resume.jsx` |
| Contact | `client/src/sections/Contact.jsx` |
| Footer | `client/src/components/layout/Footer.jsx` |
| 404 | `client/src/pages/NotFound.jsx` |
| Theme colours, animations | `client/src/styles/index.css` |
| Page title / meta / JSON-LD | `client/src/hooks/useDocumentMeta.js` (runtime) and `server/src/services/seo.service.js` (server-injected) |

---

## 12. Adding a new admin-managed feature

Example: a **“Volunteering”** section.

1. **Model** – `server/src/models/content.js`
   ```js
   export const Volunteering = defineContentModel('Volunteering', {
     role: { type: String, required: true, trim: true },
     organization: str, date: str, description: str,
   });
   ```
2. **Validation** – `server/src/validators/resources.js`
   ```js
   export const volunteeringSchema = z.object({
     role: requiredText(120, 'Role'), organization: text(120).optional(),
     date: text(40).optional(), description: markdown(3000).optional(), ...baseItem,
   }).strict();
   ```
3. **Register** – `server/src/resources/registry.js`
   ```js
   volunteering: { model: Volunteering, schema: volunteeringSchema, publicKey: 'volunteering', searchFields: ['role'] },
   ```
   → CRUD API, public payload (`site.volunteering`), overview counts and cache invalidation all work automatically.
4. **Section setting** – add `{ key: 'volunteering', title: 'Volunteering', eyebrow: 'Community', … }` to `SECTION_DEFAULTS` in `server/src/validators/singletons.js` (existing databases pick it up automatically).
5. **Admin form** – add an entry to `client/src/admin/resources.js` (label, icon, fields, list display) and add it to the sidebar `NAV` in `client/src/admin/layout/AdminLayout.jsx`.
6. **Public UI** – create `client/src/sections/Volunteering.jsx` (copy `Achievements.jsx`) and register it in `client/src/sections/registry.js`:
   ```js
   volunteering: { component: Volunteering, hasContent: (s) => s.volunteering?.length > 0 },
   ```
7. Add a test in `server/tests/api.test.js`.

For a new **singleton field** (e.g. a profile “pronouns” field): add it to `profileSchema` with a `.default()`, then add a field to the relevant group in `client/src/admin/pages/ProfilePage.jsx` and use it in a component.

---

## 13. Backup & recovery

* **Database** – Atlas: enable *Cloud Backup* (paid tiers) or schedule `mongodump`:
  ```bash
  mongodump --uri "$MONGODB_URI" --out backups/$(date +%F)
  mongorestore --uri "$MONGODB_URI" --drop backups/2026-09-24
  ```
  Keep at least 7 daily + 4 weekly copies off-site.
* **Media** – Cloudinary keeps originals; enable *Backup* in Cloudinary settings, or export with the Admin API. The `media` collection maps every file to its `publicId` (`key`).
* **Content export** – `GET /api/public/site?preview=1` (while logged in) returns all content as one JSON document — a quick human-readable snapshot.
* **Draft safety** – *Discard drafts* restores the last published profile/settings.
* **Lost admin password** – on the server: set `ADMIN_EMAIL`/`ADMIN_PASSWORD` and run `npm run create-admin -- --reset` (also signs out all sessions).
* **Compromised secret** – rotate `JWT_SECRET` (invalidates all sessions), rotate DB & Cloudinary credentials, redeploy.

---

## 14. Scalability recommendations

* Move the public-content cache to **Redis** when running more than one API instance (today each instance caches for ≤ 60 s and invalidates on its own writes).
* Put a CDN (Cloudflare) in front of the single service; `/assets/*` are immutable and `/api/public/*` uses ETags.
* Pre-render/SSR public pages (e.g. migrate the public site to React Router framework mode or Next.js) if blog SEO becomes important.
* Add an audit log collection for admin actions; add multi-user roles (`editor`, `admin`) — `User.role` is already an enum.
* Add Cloudflare Turnstile to the contact form if spam increases (the endpoint already has honeypot, timing and rate limiting).
* Full draft/versioning for collections (per-item `draft` copies) if you need scheduled publishing.
* Automated CI: run `npm test` and `npm run lint` on every push (GitHub Actions).
* Enable **2FA (TOTP)** for the admin login.

---

## 15. Production-readiness audit

Performed before delivery. ✅ = implemented & verified, ⚠️ = accepted trade-off / recommendation.

| Area | Result |
|---|---|
| **Security headers** | ✅ Helmet: strict CSP (`script-src 'self'`, no inline scripts), HSTS, `nosniff`, frame-ancestors none, referrer policy — verified in production mode with zero CSP violations |
| **Authentication** | ✅ bcrypt(12), generic errors + dummy hash (no user enumeration), login rate limit, account lockout, httpOnly/Secure/SameSite cookies, 15-min JWT (algorithm/issuer/audience pinned), rotating single-use refresh tokens with reuse detection, token versioning, session list & global sign-out |
| **Authorization** | ✅ Every `/api/admin/*` route behind `requireAdmin`; preview mode requires auth; tested: all admin endpoints return 401 without a session, forged tokens rejected |
| **CSRF** | ✅ Custom header + Origin allow-list + SameSite cookies; tested (missing header → 403, foreign origin → 403) |
| **Input validation** | ✅ Strict zod schemas on every write (unknown keys rejected), length limits, control-character stripping, `$`/`.` keys stripped globally, URL scheme allow-list (blocks `javascript:`), regex-escaped search |
| **XSS** | ✅ React escaping, Markdown rendered without raw HTML, safe link handling, JSON-LD escaped, messages rendered as plain text, SVG uploads refused |
| **File uploads** | ✅ Magic-byte type detection (ignores client MIME), size limits (8 MB images / 10 MB PDF), sharp re-encoding (strips EXIF/GPS, neutralises malformed files, pixel limit), folder allow-list, path-traversal guard, `nosniff` |
| **Database** | ✅ Unique indexes (slugs, e-mail, token hashes), TTL index for sessions, atomic singleton upsert, pooled connection, graceful shutdown |
| **Error handling** | ✅ Central handler, no stack traces in production, consistent `{error, fields}` format, route-level React error boundary, API/network error states with retry |
| **Privacy** | ✅ Hidden e-mail/phone never sent to browsers; visitor IPs stored only as HMAC |
| **Spam** | ✅ Honeypot, minimum fill time, link-count heuristic, 5 messages/hour/IP |
| **Performance** | ✅ Code splitting (admin & sections lazy), cached single public request with ETag/304, compression, immutable asset caching, lazy responsive images, CDN transforms, self-hosted fonts, CSS-only animations |
| **Accessibility** | ✅ Semantic landmarks & heading order, skip link, visible focus, labelled controls & dialogs (native `<dialog>`), `aria-live` toasts/status, keyboard support (Esc closes menus/dialogs), WCAG-AA text contrast (`primary-ink` token), reduced-motion support |
| **SEO** | ✅ Server-injected title/description/OG/Twitter/canonical/JSON-LD, per-project meta, dynamic sitemap & robots, real 404 status, `noindex` for admin/preview |
| **Responsive** | ✅ Verified at 320, 375, 430, 640, 768, 1024, 1280 and 1440 px with an automated horizontal-overflow check; centred single-column hero below 1024 px, balanced grids (no orphan cards), mobile menu, drawer forms, responsive admin |
| **Secrets** | ✅ Env validated at boot (refuses weak/placeholder `JWT_SECRET`), `.env` git-ignored (verified), no secrets in the client bundle |
| **Dependencies** | ✅ `npm audit`: 0 vulnerabilities (server & client) at time of delivery |
| **Tests** | ✅ 16 API integration tests + automated end-to-end browser run of the admin workflow (login → validation → create → publish → public update → logout) |
| Lockout DoS | ⚠️ An attacker can lock the admin login for 15 min by failing 5 times; accepted to stop brute force. Add 2FA/IP allow-listing for stronger protection. |
| Local storage driver | ⚠️ Development only (ephemeral disks on PaaS). Use `STORAGE_DRIVER=cloudinary` in production. |
| Multi-instance cache | ⚠️ In-process cache (≤ 60 s staleness across instances). Use Redis when scaling horizontally. |
| Media still referenced | ⚠️ Deleting a media file in use shows a fallback placeholder; the confirm dialog warns about it. |

---

## 16. Content provenance

All seeded content comes from `Onik_CV.pdf` (name, contact details, career objective, education, skills, three projects with their GitHub/live links) and the supplied professional photo (used unaltered; the hero cut-out is the same photo with only the background removed). Project thumbnails are screenshots of the live demos.

Added later at the owner’s request:
* **NextMeet – Real-Time Video Chat App** (from the project README and live URL; GitHub link to be added).
* **Software Developer Intern — Arbree Solution** with **placeholder** dates/description to be edited in Dashboard → Experience.
* **AI Tools** skill group (GitHub Copilot, Claude, Codex, Antigravity).

Sections without CV data (research, certifications, achievements, services, testimonials, blog) are fully functional but empty and hidden until content is added.
