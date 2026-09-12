const jwt = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/User");

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
}

function cookieOptions() {
  const days = Number(process.env.JWT_COOKIE_EXPIRES_DAYS || 1);
  return {
    expires: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    httpOnly: true, // not readable by client-side JS -> mitigates XSS token theft
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    sameSite: "lax", // basic CSRF mitigation for a cookie-auth app
  };
}

/**
 * Issues a JWT, sets it as an HTTP-only cookie, and attaches it to
 * res.locals so views can render immediately without another lookup.
 */
function sendAuthCookie(user, req, res) {
  const token = signToken(user._id);
  res.cookie("token", token, cookieOptions());
  return token;
}

function clearAuthCookie(res) {
  res.cookie("token", "loggedout", {
    expires: new Date(Date.now() + 1000),
    httpOnly: true,
  });
}

/**
 * Populates req.user / res.locals.sessionUser from the JWT cookie when
 * present. Never blocks the request - use `requireAuth` for that.
 */
const attachUser = catchAsync(async (req, res, next) => {
  const token = req.cookies?.token;
  res.locals.sessionUser = null;
  req.user = null;

  if (!token || token === "loggedout") return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id);
    if (currentUser) {
      req.user = currentUser;
      res.locals.sessionUser = currentUser;
    }
  } catch (err) {
    // Invalid/expired token: treat the request as logged out rather
    // than throwing, so the site keeps working for anonymous users.
  }

  next();
});

/** Blocks the request unless a valid session is present. */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.redirect("/login");
  }
  next();
}

module.exports = {
  signToken,
  sendAuthCookie,
  clearAuthCookie,
  attachUser,
  requireAuth,
};
