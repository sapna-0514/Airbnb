/**
 * Wraps an async route/controller function so any rejected promise
 * is forwarded to Express's error-handling middleware instead of
 * crashing the process or requiring a try/catch in every controller.
 */
module.exports = function catchAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
