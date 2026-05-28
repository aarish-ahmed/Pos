# Bistro POS — Production deployment

Replace every `YOUR_*` placeholder in `server/.env` and `client/.env` with your real values.

## 1. Database — MongoDB Atlas

1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. **Database Access** → create a user and password.
3. **Network Access** → add `0.0.0.0/0` (or your host’s IP).
4. **Connect** → Drivers → copy the connection string.
5. Paste into `server/.env` as `MONGODB_URI` (replace `YOUR_ATLAS_USER`, `YOUR_ATLAS_PASSWORD`, `YOUR_CLUSTER`).
6. From project root, seed Atlas once: `npm run seed`

## 2. Menu images — Cloudinary

1. Sign up at [cloudinary.com](https://cloudinary.com).
2. Dashboard → copy **Cloud name**, **API Key**, **API Secret**.
3. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in `server/.env` (and on Render/Railway).

Uploads return a permanent HTTPS URL (not `server/uploads/menu`).

## 3. Backend — Render or Railway

| Setting | Value |
|--------|--------|
| Root directory | `server` |
| Build command | `npm install` |
| Start command | `npm start` |

**Environment variables** (copy from `server/.env`):

- `NODE_ENV` = `production`
- `MONGODB_URI` = Atlas string
- `JWT_SECRET` = your long secret from `server/.env`
- `CLIENT_URL` = your live frontend URL (e.g. `https://bistro-pos.vercel.app`)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `TAX_RATE`, `SERVICE_CHARGE_RATE` (optional)
- `PORT` is usually set by the host

Note the public API URL (e.g. `https://bistro-pos-api.onrender.com`) for the frontend.

## 4. Frontend — Vercel or Netlify

### Vercel

1. Import repo; set **Root Directory** to `client`.
2. Framework: **Vite** (auto-detected).
3. **Environment variable:** `VITE_API_URL` = your Render/Railway API URL (no trailing slash).
4. Deploy. Set `CLIENT_URL` on the server to your Vercel URL (e.g. `https://bistro-pos.vercel.app`).

### Netlify

1. **Base directory:** `client`
2. **Build command:** `npm run build`
3. **Publish directory:** `dist`
4. Add env var `VITE_API_URL` = your API URL.
5. `netlify.toml` in `client/` handles SPA routing.

Update `client/.env`, `client/.env.production`, and the host’s dashboard with the same `VITE_API_URL`.

## 5. CORS

Configured in `server/src/index.js` via `CLIENT_URL` in `server/.env`. Must match your deployed frontend **exactly** (https, domain, no trailing slash).

## 6. Local development

`server/.env.local` overrides production values on your machine:

- Local MongoDB: `mongodb://127.0.0.1:27017/restaurant_pos`
- `CLIENT_URL=http://localhost:5173`
- `client/.env.development` leaves `VITE_API_URL` empty (Vite proxy to port 5000)

Run: `npm run dev` from project root.

## Checklist

- [ ] Atlas `MONGODB_URI` in `server/.env` + host dashboard
- [ ] Strong `JWT_SECRET` in `server/.env` + host dashboard
- [ ] `CLIENT_URL` = live frontend URL
- [ ] Cloudinary vars set
- [ ] `VITE_API_URL` = live API URL (client + Vercel/Netlify)
- [ ] `npm run seed` against Atlas
- [ ] Test login, menu upload, orders on production URLs
