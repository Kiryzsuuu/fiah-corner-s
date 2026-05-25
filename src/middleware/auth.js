const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { unauthorized, forbidden } = require('../utils/response');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return unauthorized(res, 'Token tidak ditemukan');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);
    if (!admin) return unauthorized(res, 'Akun tidak ditemukan');
    req.admin = admin;
    next();
  } catch {
    return unauthorized(res, 'Token tidak valid atau sudah kedaluwarsa');
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.admin?.role)) {
    return forbidden(res, 'Akses ditolak');
  }
  next();
};

module.exports = { authenticate, authorize };
