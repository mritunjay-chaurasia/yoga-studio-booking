# Serenity Yoga Studio — Booking System

A production-ready MERN application that replaces WhatsApp and paper sign-in sheets for yoga studios. Real MongoDB persistence — not mock APIs or hardcoded frontend data.

## Problems Solved

| Studio pain point | How this app fixes it |
|-------------------|----------------------|
| Students double-book | Unique index + server check → **409 Already booked** |
| Classes overbooked | Atomic transaction + capacity check → **400 Class Full** |
| Instructors don't know schedule | Instructor dashboard: today + upcoming + student rosters |
| No visibility on full vs empty | Live `bookedCount` / `seatsLeft` on landing, admin, instructor views |
| Scheduling conflicts | Blocks overlapping classes per instructor; blocks student double-booking same time slot |

## Real studio owner workflow

1. **First start** — empty database creates your admin account from `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`)
2. **Login as admin** → Admin Dashboard
3. **Add staff** — instructors (and students if needed) via **Staff → Add Staff**
4. **Create classes** — assign instructor, date, time, capacity
5. **Students** — admin adds them via **Staff → Add Staff** (role: student); they log in to book classes
6. **Instructors** — log in to see today's and upcoming classes with who booked

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, React Router, Axios, Tailwind CSS, React Hook Form, React Toastify |
| Backend | Node.js, Express.js, MongoDB, Mongoose, Joi, JWT (httpOnly cookies) |

## Folder Structure

```
yoga-studio/
├── client/src/
│   ├── apis/           # API modules (auth, user, class, booking…)
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   └── utils/
└── server/
    ├── config/
    ├── controllers/
    ├── middlewares/
    ├── models/
    ├── routes/
    ├── validators/
    └── utils/
```

## Installation

```bash
# Backend
cd server && npm install && cp .env.example .env

# Frontend
cd client && npm install

# Run (two terminals)
cd server && npm run dev
cd client && npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5000/api

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Auth tokens |
| `CLIENT_URL` | CORS origin |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | First-time studio owner account |
| `STUDIO_ID` | Tenant id (default: `default`) — ready for sister studios |

## Requirement Checklist

| Requirement | Status |
|-------------|--------|
| MERN stack, `/client` + `/server` | Done |
| User / YogaClass / Booking models + roles | Done |
| Student: browse, book, cancel, own bookings | Done |
| Instructor: schedule + student lists | Done |
| Admin: classes CRUD, dashboard stats, staff management | Done |
| Booking rules: exists, no duplicate, capacity | Done |
| REST APIs (users, classes, bookings, schedule, dashboard) | Done |
| Real MongoDB (no mock APIs) | Done |
| Multi-tenant `studioId` on models + API scoping | Done |
| Security: JWT cookies, Joi, Helmet, rate limits, RBAC | Done |

## API Reference

See routes under `/api`: `auth`, `users`, `classes`, `bookings`, `instructors`, `dashboard`.

**Booking errors:** `409` Already booked / schedule conflict · `400` Class full / past class · `404` Not found

## Multi-Studio (Sister Studios)

Each record has `studioId`. APIs scope data by the logged-in user's studio. To add another studio later: new `STUDIO_ID` + admin account per location.

## License

MIT
