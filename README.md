# Bistro POS — Restaurant Point of Sale

A full-stack MERN restaurant POS with a calm sage-and-cream UI and standard restaurant workflows.

## Features

- **Dashboard** — Today's revenue, orders, average ticket, top sellers
- **Floor & orders** — Table map (select table → start/open order), dine-in and takeaway, discounts (fixed or %), split payments, send to kitchen
- **Kitchen display** — Live tickets, item status (start / ready), auto-refresh
- **Order history** — Today's orders with status and totals
- **Menu management** — Categories and items with local photo upload (admin/manager)
- **Analytics** — Multi-POV reports (time, menu, operations, team) with date/type filters and CSV export
- **Menu photos** — Upload, URL, or remove item photos
- **Settings** — Restaurant info, tax, service charge, receipt footer; admin staff accounts
- **Kitchen alerts** — Sound + toast when an order is marked ready (any page)
- **Auth & roles** — admin, manager, cashier, waiter with role-based access (enforced on API and UI)
- **Staff management** (admin) — create, change role, deactivate, or delete staff accounts

## Tech stack

- **Backend:** Node.js, Express, MongoDB, JWT
- **Frontend:** React, Vite, Tailwind CSS, Lucide icons

## Prerequisites

- Node.js 18+
- MongoDB running locally (`mongodb://127.0.0.1:27017`)

## Setup

```bash
# From project root
npm run install:all

# Copy env (already included for local dev)
# cp server/.env.example server/.env

# Seed database (tables, menu, demo users)
npm run seed

# Start API + UI
npm run dev
```

- **Frontend:** http://localhost:5173  
- **API:** http://localhost:5000  

## Demo logins

| Role    | Email            | Password    |
|---------|------------------|-------------|
| Admin   | admin@pos.com    | admin123    |
| Manager | manager@pos.com  | manager123  |
| Cashier | cashier@pos.com  | cashier123  |
| Waiter  | waiter@pos.com   | waiter123   |

## Role access (summary)

| Capability | Admin | Manager | Cashier | Waiter |
|------------|:-----:|:-------:|:-------:|:------:|
| Dashboard & sales stats | ✓ | ✓ | ✓ | Open orders only |
| Floor: orders & kitchen send | ✓ | ✓ | ✓ | ✓ |
| Payments & discounts | ✓ | ✓ | ✓ | — |
| Void / cancel orders | ✓ | ✓ | — | — |
| Kitchen: mark ready | ✓ | ✓ | View only | View only |
| Order history | ✓ | ✓ | ✓ | — |
| Menu, reports, settings | ✓ | ✓ | — | — |
| Staff accounts | ✓ | — | — | — |

## Project structure

```
Pos/
├── client/          React frontend
├── server/          Express API
├── package.json     Root scripts (dev, seed)
└── README.md
```

## Menu photos

In **Menu**, click an item and use **Upload from computer** (JPG/PNG/WEBP/GIF, max 5MB). Locally, files are saved under `server/uploads/menu`. In production, set **Cloudinary** env vars on the server (see `server/.env.example`) so images persist across deploys. You can still paste an external image URL.

## Production deployment

**Full step-by-step guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)

| File | Purpose |
|------|---------|
| `server/.env` | Production: Atlas, JWT, `CLIENT_URL`, Cloudinary |
| `server/.env.local` | Local overrides (Mongo on `127.0.0.1`, `localhost:5173`) |
| `client/.env` | `VITE_API_URL` → Render/Railway API |
| `client/.env.production` | Same URL for Vercel/Netlify builds |

Replace all `YOUR_*` placeholders before deploying.

## License

MIT
