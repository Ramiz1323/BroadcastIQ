function notFound(req, res, next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;

  if (status >= 500) {
    console.error("[error]", err.message, err.stack);
  }

  const safeMessage =
    status >= 500 ? "Something went wrong on the server. Please try again." : err.message;

  res.status(status).json({ success: false, message: safeMessage });
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { notFound, errorHandler, asyncHandler };
