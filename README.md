
# YumRush — Online Food Delivery (Starter)

A minimal full‑stack template you can run locally.

## Project structure
```
food-delivery/
├── backend/           # Node/Express API (file-based storage)
│   ├── data/
│   │   ├── menu.json
│   │   └── orders.json
│   ├── package.json
│   └── server.js
└── frontend/          # Vanilla HTML/CSS/JS client
    ├── index.html
    ├── styles.css
    └── app.js
```

## How to run (2 terminals)
1) Backend
```bash
cd backend
npm i
npm run dev
```
This starts the API on http://localhost:4000

2) Frontend
Open `frontend/index.html` in your browser (double-click).
(Or use a simple server: `npx serve ../frontend`)

## Features
- Fetch menu (`GET /api/menu`)
- Add items to cart (client-side)
- Create order (`POST /api/orders`)
- Mock payment (`POST /api/payments/mock`)
- Check order by id (`GET /api/orders/:id`)

## Next steps
- Replace mock payment with Razorpay/Stripe
- Add auth (JWT) for admin & customers
- Connect to a database (MongoDB/Postgres) and deploy
- Add restaurant, search, filters, and delivery address with maps
