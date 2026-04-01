# De 3 Ster — Reserveringssysteem

## Structuur

```
3ster/
├── backend/              ← Node.js + Express API
│   └── src/
│       ├── routes/       ← reservations.js
│       ├── controllers/
│       ├── models/
│       ├── middleware/   ← auth.js (JWT)
│       └── config/      ← db.js
├── dashboard/            ← React admin UI (/inlog)
│   └── src/
│       ├── pages/        ← Login.jsx ✅
│       ├── components/
│       ├── hooks/
│       └── api/
├── docker-compose.yml    ← MySQL + phpMyAdmin lokaal
└── .env.example
```

## Volgende stappen

1. Backend opzetten:      `cd backend && npm install`
2. Dashboard opzetten:    `cd dashboard && npm install`
3. Database starten:      `docker compose up -d`
4. Backend starten:       `cd backend && npm run dev`
5. Dashboard starten:     `cd dashboard && npm run dev`
