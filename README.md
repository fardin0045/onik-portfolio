# Onik — Portfolio & CMS

A modern developer portfolio with its own secure admin dashboard.
**React 19 · Vite · Tailwind CSS v4 · Node.js · Express 5 · MongoDB · Cloudinary**

* Public site: hero with animated portrait, toolkit with brand logos, projects with detail pages, experience, education, blog, resume, contact form, dark/light theme, welcome character.
* Admin CMS at `/admin`: edit every piece of content, upload images/CV, reorder, hide, draft → preview → publish, SEO, colours, section order, messages inbox, media library.

## Quick start

```bash
npm run install:all
cp server/.env.example server/.env   # set JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, MONGODB_URI
npm run seed                         # imports CV content, photo and CV PDF + creates the admin
npm run dev                          # http://localhost:5173  (admin: /admin)
```

No local MongoDB? `npm run dev:memory` (in-memory database, auto-seeded).

| Command | What it does |
|---|---|
| `npm run dev` | API (4000) + web (5173) |
| `npm test` | API integration tests |
| `npm run lint` | Lint the client |
| `npm run build` / `npm start` | Production build / start (single service) |

**Going live (Vercel + Render + MongoDB Atlas + Cloudinary): [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)**

Full architecture, API reference, deployment guide (Render + MongoDB Atlas + Cloudinary + custom domain), how-to guides and the production-readiness audit: **[PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)**.
