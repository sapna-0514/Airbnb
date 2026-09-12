require("dotenv").config();

const path = require("path");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const connectDB = require("./config/db");
const { attachUser } = require("./middleware/auth");
const globalErrorHandler = require("./middleware/errorHandler");
const errorController = require("./controllers/errorController");

const storeRoutes = require("./routes/storeRoutes");
const hostRoutes = require("./routes/hostRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Trust the first proxy hop (needed for correct req.ip / secure cookies behind
// load balancers on platforms like Render, Heroku, or behind an Nginx proxy).
app.set("trust proxy", 1);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// --- Security & hardening middleware -------------------------------------
app.use(helmet({ contentSecurityPolicy: false })); // CSP disabled: CDN Tailwind/scripts are used in views
app.use(mongoSanitize()); // strips $/. operators from user input to prevent NoSQL injection
app.use(xss()); // sanitizes user input from malicious HTML/JS
app.use(hpp()); // prevents HTTP parameter pollution

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// --- Body / cookie parsing -------------------------------------------------
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// --- Static assets ----------------------------------------------------------
app.use(express.static(path.join(__dirname, "public")));

// --- Auth: populate req.user / res.locals.sessionUser on every request -----
app.use(attachUser);

// --- Routes ------------------------------------------------------------------
app.use(storeRoutes);
app.use(hostRoutes);
app.use(authRoutes);

// --- 404 + centralized error handling -----------------------------------
app.use(errorController.pageNotFound);
app.use(globalErrorHandler);

// --- Server bootstrap --------------------------------------------------------
const PORT = process.env.PORT || 3007;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB. Server not started.", err);
    process.exit(1);
  });

module.exports = app;
