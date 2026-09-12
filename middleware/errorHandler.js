const AppError = require("../utils/AppError");

function handleCastErrorDB(err) {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
}

function handleDuplicateFieldsDB(err) {
  const value = Object.values(err.keyValue || {}).join(", ");
  return new AppError(
    `Duplicate value: "${value}". Please use another value.`,
    400
  );
}

function handleValidationErrorDB(err) {
  const messages = Object.values(err.errors).map((el) => el.message);
  return new AppError(`Invalid input data. ${messages.join(". ")}`, 400);
}

function handleJWTError() {
  return new AppError("Invalid session. Please log in again.", 401);
}

function handleJWTExpiredError() {
  return new AppError("Your session has expired. Please log in again.", 401);
}

function renderError(req, res, err) {
  const status = err.statusCode || 500;
  res.status(status).render("error", {
    pageTitle: "Something went wrong",
    currentpage: "error",
    statusCode: status,
    message: err.isOperational ? err.message : "Something went wrong. Please try again.",
  });
}

/**
 * Centralized Express error-handling middleware. Every controller
 * forwards errors here via next(err) (directly, or automatically
 * through catchAsync), so error formatting only lives in one place.
 */
module.exports = function globalErrorHandler(err, req, res, next) {
  err.statusCode = err.statusCode || 500;

  let error = Object.assign(
    Object.create(Object.getPrototypeOf(err)),
    err
  );
  error.message = err.message;

  if (error.name === "CastError") error = handleCastErrorDB(error);
  if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  if (error.name === "ValidationError") error = handleValidationErrorDB(error);
  if (error.name === "JsonWebTokenError") error = handleJWTError();
  if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

  if (process.env.NODE_ENV !== "production") {
    console.error("ERROR:", err);
  } else if (!error.isOperational) {
    console.error("UNEXPECTED ERROR:", err);
  }

  renderError(req, res, error);
};
