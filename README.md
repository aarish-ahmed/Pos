# Bistro POS — Restaurant Point of Sale

A full-stack MERN restaurant POS with a calm sage-and-cream UI and standard restaurant workflows.

## Features

- **Dashboard** — Today's revenue, orders, average ticket, top sellers
- **Floor & orders** — Table map, dine-in and takeaway, add items, send to kitchen, payments
- **Kitchen display** — Live tickets, item status (start / ready), auto-refresh
- **Order history** — Today's orders with status and totals
- **Menu management** — Categories and items with local photo upload (admin/manager)
- **Reports** — 7-day sales breakdown
- **Settings** — Restaurant info, tax, service charge, receipt footer
- **Auth & roles** — admin, manager, cashier, waiter

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

## Project structure

```
Pos/
├── client/          React frontend
├── server/          Express API
├── package.json     Root scripts (dev, seed)
└── README.md
```

## Menu photos

In **Menu**, click an item and use **Upload from computer** (JPG/PNG/WEBP/GIF, max 5MB). Files are stored in `server/uploads/menu` and served at `/uploads/menu/...`. You can still paste an external image URL if needed.

## License

MIT
