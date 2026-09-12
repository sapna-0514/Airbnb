# Airbnb Clone — Production-Ready Full-Stack Application

A refactored, productionized Airbnb-style booking platform built with **Express**, **MongoDB/Mongoose**, **JWT authentication**, and server-rendered **EJS** views styled with **Tailwind CSS**.

This is a from-scratch rewrite of an earlier prototype: the raw MongoDB driver + callback-based code has been converted to **Mongoose with async/await**, authentication moved to **stateless JWT in an HTTP-only cookie**, and the app hardened with the standard Express security middleware stack.

## ✨ Features

- **Auth**: signup/login/logout, forgot/reset password via email, JWT stored in an HTTP-only, `SameSite=Lax` cookie, passwords hashed with bcrypt (12 salt rounds).
- **Listings (Host)**: full CRUD for property listings, each scoped to the logged-in host — a user can only edit or delete their own listings.
- **Bookings (Guest)**: date-range booking with a visual calendar, overlap/conflict prevention, and a "My Bookings" dashboard scoped to the logged-in user.
- **Reviews & Ratings**: one review per user per home, and a listing's average rating recalculates automatically whenever a review is added.
- **Favourites**: per-user saved listings.
- **Search & Filter**: filter by title, location, and price range; sort by rating or price.
- **Security**: Helmet security headers, rate limiting (global + stricter on auth routes), NoSQL-injection sanitization, XSS input sanitization, HTTP parameter pollution protection.
- **Responsive UI**: mobile-first layout with a collapsible nav, responsive grids, and touch-friendly forms across every page.

## 🧱 Tech Stack

| Layer      | Technology                                |
|------------|--------------------------------------------|
| Runtime    | Node.js 18+                                |
| Server     | Express 4                                  |
| Database   | MongoDB via Mongoose (schemas, validation, indexes, virtuals) |
| Auth       | JSON Web Tokens (HTTP-only cookie) + bcryptjs |
| Views      | EJS + Tailwind CSS (CDN, no build step)    |
| Security   | helmet, express-rate-limit, express-mongo-sanitize, xss-clean, hpp |
| Email      | Nodemailer (password reset)                |

## 📁 Project Structure

```
.
├── app.js                     # App entrypoint: middleware, routes, error handling
├── config/db.js                # Mongoose connection
├── models/                     # Mongoose schemas (User, Home, Booking, Review, Favourite)
├── middleware/
│   ├── auth.js                 # JWT issuing/verification, requireAuth guard
│   └── errorHandler.js         # Centralized error-handling middleware
├── controllers/                # Route handlers (async/await + try-catch via catchAsync)
├── routes/                     # Express routers
├── utils/                      # AppError, catchAsync, sendEmail helpers
├── views/                      # EJS templates (auth, host, store, partials)
├── public/                     # Static assets (css/js)
├── seed.js                     # Demo data seeder
├── Dockerfile / docker-compose.yml
└── .env.example
```

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- A MongoDB instance (local, Docker, or MongoDB Atlas)

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```
Then edit `.env`:
- `MONGO_URL` — your MongoDB connection string
- `JWT_SECRET` — a long random string (e.g. `openssl rand -hex 32`)
- `EMAIL_USER` / `EMAIL_PASSWORD` — a Gmail address + **App Password** (not your real password) if you want password-reset emails to actually send. If left blank, reset links are logged to the console instead, so local dev still works.

> ⚠️ **Never commit your `.env` file.** It's already in `.gitignore`.

### 4. (Optional) Seed demo data
```bash
npm run seed
```
This creates two demo users and three demo listings. Demo login: `aarav@example.com` / `password123`.

### 5. Run the app
```bash
npm run dev     # with nodemon (auto-restart)
# or
npm start       # plain node
```

Visit **http://localhost:3007**.

## 🐳 Running with Docker

```bash
docker compose up --build
```

This spins up the app plus a local MongoDB container. The app will be available at `http://localhost:3007`. Update `docker-compose.yml`/`.env` if you'd rather point at MongoDB Atlas instead of the bundled `mongo` service.

## 🔒 Security Notes

- Passwords are hashed with bcrypt (12 rounds) and never returned in API/render responses.
- JWTs are stored in `httpOnly` cookies (not accessible to client-side JS) and marked `secure` automatically when `NODE_ENV=production`.
- Auth routes (`/login`, `/signup`, `/forgot-password`, `/reset-password/:token`) are rate-limited to slow down brute-force attempts.
- All user-supplied input is sanitized against NoSQL injection and XSS.
- Ownership checks are enforced server-side (not just hidden in the UI) for editing/deleting listings, cancelling bookings, and managing favourites/reviews.

## 🗺️ Suggested Next Steps

- Add automated tests (Jest + Supertest) for controllers and models.
- Swap the calendar/date-picker for a maintained library if you want more advanced availability rules.
- Add image upload (e.g. via Multer + S3/Cloudinary) instead of pasting photo URLs.
- Add pagination to `/homes` for large datasets.
