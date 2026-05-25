const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { ok, unauthorized, badRequest } = require('../utils/response');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

exports.login = async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({
    $or: [{ username }, { email: username }],
  }).select('+password');

  if (!admin || !(await admin.comparePassword(password))) {
    return unauthorized(res, 'Username atau password salah');
  }

  admin.lastLogin = new Date();
  await admin.save({ validateBeforeSave: false });

  const token = signToken(admin._id);
  const adminData = admin.toObject();
  delete adminData.password;

  ok(res, 'Login berhasil', { token, admin: adminData });
};

exports.me = async (req, res) => {
  ok(res, 'Data admin', req.admin);
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return badRequest(res, 'Password lama dan baru wajib diisi');
  }

  const admin = await Admin.findById(req.admin._id).select('+password');
  if (!(await admin.comparePassword(currentPassword))) {
    return unauthorized(res, 'Password lama salah');
  }

  admin.password = newPassword;
  await admin.save();
  ok(res, 'Password berhasil diubah');
};

exports.refreshToken = async (req, res) => {
  const token = signToken(req.admin._id);
  ok(res, 'Token diperbarui', { token });
};
