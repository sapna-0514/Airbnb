const crypto = require("crypto");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const sendEmail = require("../utils/sendEmail");
const { sendAuthCookie, clearAuthCookie } = require("../middleware/auth");

exports.getSignup = (req, res) => {
  res.render("auth/signup", {
    pageTitle: "Signup",
    currentpage: "signup",
    errorMessage: null,
  });
};

exports.postSignup = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).render("auth/signup", {
      pageTitle: "Signup",
      currentpage: "signup",
      errorMessage: "Name, email and password are all required.",
    });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).render("auth/signup", {
      pageTitle: "Signup",
      currentpage: "signup",
      errorMessage: "Email already registered. Please login.",
    });
  }

  const user = await User.create({ name, email, password });
  sendAuthCookie(user, req, res);
  res.redirect("/");
});

exports.getLogin = (req, res) => {
  res.render("auth/login", {
    pageTitle: "Login",
    currentpage: "login",
    errorMessage: null,
  });
};

exports.postLogin = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).render("auth/login", {
      pageTitle: "Login",
      currentpage: "login",
      errorMessage: "Please provide both email and password.",
    });
  }

  // .select("+password") because the schema hides it by default
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password"
  );

  const isMatch = user ? await user.comparePassword(password) : false;
  if (!user || !isMatch) {
    return res.status(401).render("auth/login", {
      pageTitle: "Login",
      currentpage: "login",
      errorMessage: "Invalid email or password.",
    });
  }

  sendAuthCookie(user, req, res);
  res.redirect("/");
});

exports.postLogout = (req, res) => {
  clearAuthCookie(res);
  res.redirect("/login");
};

exports.getForgotPassword = (req, res) => {
  res.render("auth/forgot-password", {
    pageTitle: "Forgot Password",
    currentpage: "login",
    errorMessage: null,
    successMessage: null,
  });
};

exports.postForgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email: (email || "").toLowerCase() });

  // Always show the same message whether or not the account exists,
  // so this endpoint can't be used to enumerate registered emails.
  const genericSuccess =
    "If an account exists for that email, a reset link has been sent.";

  if (!user) {
    return res.render("auth/forgot-password", {
      pageTitle: "Forgot Password",
      currentpage: "login",
      errorMessage: null,
      successMessage: genericSuccess,
    });
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  user.resetToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  user.resetTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
  const resetLink = `${baseUrl}/reset-password/${rawToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: "Airbnb Clone — Password Reset Link",
      html: `
        <h2>Password Reset Request</h2>
        <p>Click below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetLink}"
           style="background:#ef4444;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Reset Password
        </a>
        <p style="color:gray;margin-top:16px;">If you didn't request this, you can safely ignore this email.</p>
      `,
    });
  } catch (err) {
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError("Could not send reset email. Please try again later.", 500));
  }

  res.render("auth/forgot-password", {
    pageTitle: "Forgot Password",
    currentpage: "login",
    errorMessage: null,
    successMessage: genericSuccess,
  });
});

exports.getResetPassword = catchAsync(async (req, res) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetToken: hashedToken,
    resetTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return res.render("auth/forgot-password", {
      pageTitle: "Forgot Password",
      currentpage: "login",
      errorMessage: "Reset link is expired or invalid.",
      successMessage: null,
    });
  }

  res.render("auth/reset-password", {
    pageTitle: "Reset Password",
    currentpage: "login",
    token: req.params.token,
    errorMessage: null,
  });
});

exports.postResetPassword = catchAsync(async (req, res) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetToken: hashedToken,
    resetTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return res.render("auth/forgot-password", {
      pageTitle: "Forgot Password",
      currentpage: "login",
      errorMessage: "Reset link is expired or invalid.",
      successMessage: null,
    });
  }

  if (!req.body.password || req.body.password.length < 6) {
    return res.status(400).render("auth/reset-password", {
      pageTitle: "Reset Password",
      currentpage: "login",
      token: req.params.token,
      errorMessage: "Password must be at least 6 characters.",
    });
  }

  user.password = req.body.password; // hashed by the pre-save hook
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  sendAuthCookie(user, req, res);
  res.redirect("/");
});
