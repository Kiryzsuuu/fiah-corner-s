const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const mailService = require('../services/mail.service');
const { ok, created, unauthorized, badRequest, notFound } = require('../utils/response');

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

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  const existing = await Admin.findOne({ $or: [{ username }, { email }] });
  if (existing) return badRequest(res, 'Username atau email sudah digunakan');

  const admin = await Admin.create({ username, email, password, role: 'kasir' });
  const result = admin.toObject();
  delete result.password;

  created(res, 'Akun berhasil dibuat. Hubungi superadmin untuk mengaktifkan akses penuh.', result);
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const admin = await Admin.findOne({ email });

  // Selalu kembalikan sukses agar tidak bocorkan info email terdaftar
  if (!admin) return ok(res, 'Jika email terdaftar, link reset password akan dikirim.');

  const rawToken = crypto.randomBytes(32).toString('hex');
  admin.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  admin.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 jam
  await admin.save({ validateBeforeSave: false });

  const origin = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
  const resetUrl = `${origin}/?reset=${rawToken}`;

  try {
    await mailService.sendPasswordReset({ to: admin.email, name: admin.username, resetUrl });
  } catch (err) {
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save({ validateBeforeSave: false });
    return badRequest(res, 'Gagal mengirim email, coba lagi nanti');
  }

  ok(res, 'Jika email terdaftar, link reset password akan dikirim.');
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const admin = await Admin.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!admin) return badRequest(res, 'Token tidak valid atau sudah kedaluwarsa');

  admin.password = password;
  admin.resetPasswordToken = undefined;
  admin.resetPasswordExpires = undefined;
  await admin.save();

  ok(res, 'Password berhasil direset. Silakan login.');
};

exports.me = async (req, res) => {
  ok(res, 'Data admin', req.admin);
};

exports.updateMe = async (req, res) => {
  const { username, email } = req.body;
  const admin = req.admin;

  if (username && username !== admin.username) {
    const exists = await Admin.findOne({ username, _id: { $ne: admin._id } });
    if (exists) return badRequest(res, 'Username sudah digunakan');
    admin.username = username;
  }
  if (email && email !== admin.email) {
    const exists = await Admin.findOne({ email, _id: { $ne: admin._id } });
    if (exists) return badRequest(res, 'Email sudah digunakan');
    admin.email = email;
  }

  await admin.save();
  ok(res, 'Profil berhasil diperbarui', admin.toObject());
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const admin = await Admin.findById(req.admin._id).select('+password');

  if (!(await admin.comparePassword(currentPassword))) {
    return unauthorized(res, 'Password saat ini salah');
  }

  admin.password = newPassword;
  await admin.save();
  ok(res, 'Password berhasil diubah');
};

exports.refreshToken = async (req, res) => {
  const token = signToken(req.admin._id);
  ok(res, 'Token diperbarui', { token });
};
