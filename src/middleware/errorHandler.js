const { error: errorResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path} —`, err.message);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return errorResponse(res, 'Validasi database gagal', 422, messages);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return errorResponse(res, `${field} sudah digunakan`, 409);
  }

  if (err.name === 'CastError') {
    return errorResponse(res, 'ID tidak valid', 400);
  }

  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Token tidak valid', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Token sudah kedaluwarsa', 401);
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Terjadi kesalahan pada server'
    : err.message;

  return errorResponse(res, message, statusCode);
};

const notFound = (req, res) => {
  errorResponse(res, `Route ${req.method} ${req.path} tidak ditemukan`, 404);
};

module.exports = { errorHandler, notFound };
