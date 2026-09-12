const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const authController = require("../controllers/authController");

// Throttle auth endpoints to slow down brute-force / credential-stuffing attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many attempts from this IP. Please try again in 15 minutes.",
});

router.get("/signup", authController.getSignup);
router.post("/signup", authLimiter, authController.postSignup);

router.get("/login", authController.getLogin);
router.post("/login", authLimiter, authController.postLogin);

router.post("/logout", authController.postLogout);

router.get("/forgot-password", authController.getForgotPassword);
router.post("/forgot-password", authLimiter, authController.postForgotPassword);

router.get("/reset-password/:token", authController.getResetPassword);
router.post("/reset-password/:token", authLimiter, authController.postResetPassword);

module.exports = router;
