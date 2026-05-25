const Admin = require('../models/Admin');
const { ok, created, notFound, badRequest } = require('../utils/response');

exports.getAll = async (req, res) => {
  const admins = await Admin.find().select('-password').sort({ createdAt: 1 });
  ok(res, 'Daftar akun', admins);
};

exports.create = async (req, res) => {
  const { username, email, password, role } = req.body;
  const existing = await Admin.findOne({ $or: [{ username }, { email }] });
  if (existing) return badRequest(res, 'Username atau email sudah digunakan');
  const admin = await Admin.create({ username, email, password, role });
  const result = admin.toObject();
  delete result.password;
  created(res, 'Akun berhasil dibuat', result);
};

exports.updateRole = async (req, res) => {
  const { id } = req.params;
  if (id === req.admin._id.toString()) {
    return badRequest(res, 'Tidak dapat mengubah role akun sendiri');
  }
  const admin = await Admin.findById(id);
  if (!admin) return notFound(res, 'Akun tidak ditemukan');
  admin.role = req.body.role;
  await admin.save();
  ok(res, 'Role berhasil diperbarui', {
    _id: admin._id,
    username: admin.username,
    email: admin.email,
    role: admin.role,
  });
};

exports.remove = async (req, res) => {
  const { id } = req.params;
  if (id === req.admin._id.toString()) {
    return badRequest(res, 'Tidak dapat menghapus akun sendiri');
  }
  const admin = await Admin.findById(id);
  if (!admin) return notFound(res, 'Akun tidak ditemukan');
  await admin.deleteOne();
  ok(res, 'Akun berhasil dihapus');
};
