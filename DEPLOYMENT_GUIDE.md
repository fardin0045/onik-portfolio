# Go-live guide — Vercel + Render + MongoDB Atlas + Cloudinary

**Result:** your portfolio at `https://onikportfolio.vercel.app` (or your own domain), admin at `/admin`.

```
Visitor ──▶ Vercel (React site) ──/api, /uploads, /sitemap.xml──▶ Render (Express API) ──▶ MongoDB Atlas
                                                                          └──────────▶ Cloudinary (images, CV)
```

Vercel forwards API calls to Render, so the browser only ever talks to your Vercel domain. That keeps
login cookies first-party (works in Safari too) and avoids CORS problems.

⏱️ About 45 minutes. Everything below is on free plans.

---

## Before you start: what you need

- A **GitHub** account (you have `fardin0045`)
- Accounts on **MongoDB Atlas**, **Cloudinary**, **Render**, **Vercel** (sign up with GitHub where possible)
- Your local MongoDB running (it is, as a Windows service) — used once to copy your content

Keep a text file open to collect these values as you go:

```
MONGODB_URI            = (step 2)
CLOUDINARY_CLOUD_NAME  = (step 3)
CLOUDINARY_API_KEY     = (step 3)
CLOUDINARY_API_SECRET  = (step 3)
RENDER_URL             = (step 5)   e.g. onik-portfolio-api.onrender.com
SITE_URL               = (step 7)   e.g. https://onikportfolio.vercel.app
```

---

## Step 1 — Put the code on GitHub

1. On GitHub: **New repository** → name `onik-portfolio` → **Private** (recommended) → *don't* add a README → **Create**.
2. In PowerShell, from the project folder:

   ```powershell
   cd C:\projects\OnikPortfolio
   git add -A
   git status            # make sure NO .env / .env.migrate / server/uploads appear in the list
   git commit -m "Portfolio platform: React client, Express API, CMS"
   git branch -M main
   git remote add origin https://github.com/fardin0045/onik-portfolio.git
   git push -u origin main
   ```

> ✅ `.gitignore` already excludes `.env`, `.env.migrate`, `node_modules`, `client/dist` and `server/uploads`.

---

## Step 2 — MongoDB Atlas (database)

1. Go to <https://cloud.mongodb.com> → create a project **Portfolio**.
2. **Create cluster** → **M0 (Free)** → provider **AWS** → region **Singapore (ap-southeast-1)** → **Create**.
3. **Security → Database Access → Add new database user**
   - Authentication: Password → username `portfolio-app` → **Autogenerate secure password** → copy it.
   - Built-in role: **Read and write to any database** → **Add user**.
4. **Security → Network Access → Add IP address → Allow access from anywhere (`0.0.0.0/0`)** → Confirm.
   (Render's free plan has no fixed IP; the strong password protects the database.)
5. **Database → Connect → Drivers** → copy the connection string. It looks like:
   `mongodb+srv://portfolio-app:<db_password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
6. Replace `<db_password>` with the password, and add the database name **`portfolio`** after `.net/`:

   ```
   mongodb+srv://portfolio-app:YOURPASSWORD@cluster0.abcde.mongodb.net/portfolio?retryWrites=true&w=majority&appName=Cluster0
   ```

   → save this as **MONGODB_URI**.

---

## Step 3 — Cloudinary (image & CV storage)

1. Sign up at <https://cloudinary.com> (free plan).
2. Open **Settings (⚙) → API Keys** (or the Dashboard) and copy **Cloud name**, **API Key**, **API Secret**.

That's all — the app creates the `portfolio/…` folders automatically.

---

## Step 4 — Copy your content to Atlas + Cloudinary (one command)

This uploads your photo, cut-out photo, CV and every project image to Cloudinary, and copies all content
(profile, projects incl. *Virtual Office System 3D*, skills, experience, research, settings, messages…)
into Atlas with the image links updated. Your admin **password is not copied** — Render creates the admin in step 5.

```powershell
cd C:\projects\OnikPortfolio\server
copy .env.migrate.example .env.migrate
notepad .env.migrate
```

Fill in `MONGODB_URI` (Atlas), `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, save, then:

```powershell
npm run migrate
```

Expected ending:

```
✅ Migration complete: 11 files uploaded to cloudinary, 14 collections copied.
```

Check: Atlas → **Browse Collections** shows `projects`, `skills`, … and Cloudinary → **Media Library** shows a `portfolio` folder.

> Need to run it again? `npm run migrate -- --force` replaces the content in Atlas.
> Afterwards you can delete `server/.env.migrate` (it contains secrets; it's git-ignored anyway).

---

## Step 5 — Render (backend API)

1. <https://dashboard.render.com> → sign in with GitHub → **New + → Blueprint**.
2. Connect the **onik-portfolio** repository. Render reads `render.yaml` and shows the service **onik-portfolio-api**
   (Node, Singapore, free, root `server`).
3. It asks for the secret values. Fill in:

   | Key | Value |
   |---|---|
   | `MONGODB_URI` | your Atlas string (step 2) |
   | `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | from step 3 |
   | `ADMIN_EMAIL` | `onik126.cse@gmail.com` |
   | `ADMIN_PASSWORD` | a **new strong password** (≥ 12 chars, upper + lower case + number) |
   | `CORS_ORIGINS` | `https://onikportfolio.vercel.app` *(your planned Vercel URL — you can fix it in step 8)* |
   | `PUBLIC_SITE_URL` | same as above |

   `JWT_SECRET` is generated automatically; `NODE_ENV`, `TRUST_PROXY=2`, `STORAGE_DRIVER=cloudinary`, etc. come from `render.yaml`.
4. Click **Apply / Deploy**. In **Logs** wait for:

   ```
   ✅ MongoDB connected (portfolio)
   🚀 API listening on …  (production, storage: cloudinary)
   ```

   (On first boot it also creates your admin account.)
5. Copy the service URL shown at the top, e.g. `https://onik-portfolio-api.onrender.com` → **RENDER_URL**.
6. Test it in the browser: `https://onik-portfolio-api.onrender.com/api/health` → `{"status":"ok",…}`

---

## Step 6 — Point the frontend at your API

Open `client/vercel.json` and replace all **4** occurrences of `YOUR-API-HOST` with your Render host
(without `https://`), e.g.:

```json
{ "source": "/api/:path*", "destination": "https://onik-portfolio-api.onrender.com/api/:path*" },
```

Then:

```powershell
cd C:\projects\OnikPortfolio
git add client/vercel.json
git commit -m "Point Vercel rewrites to the Render API"
git push
```

---

## Step 7 — Vercel (frontend)

**Your CV already links to `onikportfolio.vercel.app`, so reuse that address.**

*Option A — you still have the old `onikportfolio` project on Vercel (recommended):*
1. Open that project → **Settings → Git → Connect Git Repository** → choose `onik-portfolio`.
2. **Settings → Build and Deployment**:
   - **Root Directory:** `client`
   - Framework Preset: **Vite** · Build Command: `npm run build` · Output Directory: `dist`
   - Node.js Version: **22.x**
3. **Deployments → Redeploy** (or push any commit).

*Option B — new project:*
1. <https://vercel.com/new> → import `onik-portfolio`.
2. **Project Name:** `onikportfolio` (gives `onikportfolio.vercel.app` if free; otherwise note the URL you get).
3. **Root Directory:** `client` (click *Edit*) · Framework: **Vite** (auto-detected).
4. **Environment Variables:** none needed (leave `VITE_API_URL` empty — the rewrites handle it).
5. **Deploy**.

Your live URL (e.g. `https://onikportfolio.vercel.app`) → **SITE_URL**.

---

## Step 8 — Connect the two (one setting)

If your Vercel URL differs from what you typed in step 5: Render → **onik-portfolio-api → Environment** →
set `CORS_ORIGINS` and `PUBLIC_SITE_URL` to your exact **SITE_URL** (https, no trailing slash) → **Save changes**
(Render redeploys automatically).

> Multiple domains later? Comma-separate them: `https://onikportfolio.vercel.app,https://onik.dev`

---

## Step 9 — First login & final checks

1. Open `SITE_URL/admin` → log in with `ADMIN_EMAIL` + `ADMIN_PASSWORD`.
2. **Security → Change password** (choose a new one) → then in Render **Environment** delete `ADMIN_PASSWORD` → Save.
3. **Website Settings → SEO → Website URL** = your SITE_URL → **Save draft** → **Publish** (top bar).
4. Checklist:
   - [ ] Home page shows your photo, projects and images (images load from `res.cloudinary.com`)
   - [ ] **Download CV** opens your PDF
   - [ ] Contact form → message appears in **Contact & Messages**
   - [ ] Upload a test image in **Media Library** (it lands in Cloudinary) → delete it again
   - [ ] `SITE_URL/sitemap.xml` and `SITE_URL/robots.txt` load
   - [ ] Render **Logs**: the request lines show **your own IP** (not a Vercel IP) — confirms `TRUST_PROXY=2`
   - [ ] Try on your phone

🎉 You're live.

---

## Step 10 — Recommended extras

**Keep the API awake (free).** Render's free plan sleeps after 15 min without traffic; the next visitor waits ~50 s
(the site shows "Waking up the server…" and retries automatically). To avoid it:
<https://cron-job.org> → free account → **Create cronjob** → URL `https://onik-portfolio-api.onrender.com/api/health`
→ every **10 minutes** → Save. (One always-on service fits in Render's 750 free hours/month.)
Or upgrade the Render service to **Starter** (no sleeping).

**Google Search Console:** <https://search.google.com/search-console> → add your site → verify →
**Sitemaps** → submit `sitemap.xml`.

**Custom domain (e.g. `onik.dev`):** Vercel → Project → **Settings → Domains → Add** → create the DNS records
Vercel shows at your registrar → wait for ✅. Then update Render `CORS_ORIGINS` + `PUBLIC_SITE_URL`
(add the new domain) and **Website Settings → SEO → Website URL** → Publish.

**E-mail alerts for new messages (optional):** add to Render Environment
`SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`, `SMTP_USER=you@gmail.com`,
`SMTP_PASS=<Gmail App Password>`, `NOTIFY_EMAIL=onik126.cse@gmail.com`.

**Backups:** Atlas free tier has no automatic backups — occasionally run
`mongodump --uri "<MONGODB_URI>" --out backups\2026-09-24` (MongoDB Database Tools).

---

## Updating the site later

| Change | How |
|---|---|
| Content (projects, bio, CV, skills, settings…) | `SITE_URL/admin` — no deploy needed |
| Code | `git push` → Vercel and Render redeploy automatically |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Site shows "Waking up the server…" for a while | Normal on the free plan after inactivity (~50 s). Add the keep-alive in step 10. |
| Render deploy fails: `Invalid environment configuration` | The log lists the missing/invalid variable — add it in Render → Environment. |
| Render log: `MongoServerSelectionError` / auth failed | Atlas **Network Access** must include `0.0.0.0/0`; check user/password in `MONGODB_URI`; special characters in the password must be URL-encoded (or regenerate an alphanumeric one). |
| Login says **Origin not allowed** (403) | `CORS_ORIGINS` must exactly equal the address in your browser bar (https, no trailing `/`). |
| Logged in but immediately logged out | Use the **Vercel** URL, not the `onrender.com` URL. Keep `COOKIE_SAMESITE=lax`. |
| API calls return 404 on Vercel | `client/vercel.json` still has `YOUR-API-HOST`, or Root Directory isn't `client`. |
| Images missing | Run step 4 (`npm run migrate`) and check the Cloudinary keys on Render. |
| Contact form says "Too many requests" for everyone | `TRUST_PROXY` must be `2` for Vercel → Render. |
| Forgot admin password | Render → Shell (paid) or locally with Atlas `MONGODB_URI`: set `ADMIN_EMAIL`/`ADMIN_PASSWORD` and run `npm run create-admin -- --reset` in `server/`. |

## Security notes

- Never commit `.env` or `.env.migrate`; if a secret leaks, rotate it (Atlas user password, Cloudinary secret, and regenerate `JWT_SECRET` on Render — this signs everyone out).
- Remove `ADMIN_PASSWORD` from Render after your first login.
- Direct requests to the `onrender.com` URL bypass Vercel; that's fine (all security checks run in the API), but always share the Vercel/custom domain.
