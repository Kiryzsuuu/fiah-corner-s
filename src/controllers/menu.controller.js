const Menu = require('../models/Menu');
const { ok, created, notFound, badRequest } = require('../utils/response');

// Projection that excludes the raw image buffer — used in all list/detail responses
const NO_IMG_DATA = { 'image.data': 0 };

exports.getAll = async (req, res) => {
  const { category, available, search, featured } = req.query;
  const filter = {};

  if (category) filter.category = category;
  if (available !== undefined) filter.available = available === 'true';
  if (featured !== undefined) filter.featured = featured === 'true';
  if (search) filter.$text = { $search: search };

  const items = await Menu.find(filter, NO_IMG_DATA).sort({ sortOrder: 1, createdAt: -1 });
  const categories = [...new Set(items.map((m) => m.category))];

  ok(res, 'Data menu', items, { total: items.length, categories });
};

exports.getOne = async (req, res) => {
  const item = await Menu.findById(req.params.id, NO_IMG_DATA);
  if (!item) return notFound(res, 'Menu tidak ditemukan');
  ok(res, 'Detail menu', item);
};

// Stream the stored image — public endpoint, no auth required
exports.getImage = async (req, res) => {
  const item = await Menu.findById(req.params.id, { 'image.data': 1, 'image.contentType': 1 });
  if (!item?.image?.data || !item.image.contentType) {
    return res.status(404).end();
  }

  res.set('Content-Type', item.image.contentType);
  res.set('Cache-Control', 'public, max-age=604800, immutable');
  res.set('ETag', `"${req.params.id}-${item._id}"`);

  if (req.headers['if-none-match'] === `"${req.params.id}-${item._id}"`) {
    return res.status(304).end();
  }

  res.send(item.image.data);
};

exports.create = async (req, res) => {
  const data = { ...req.body };

  if (req.file) {
    data.image = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
      size: req.file.size,
    };
  }

  const item = await Menu.create(data);
  // Re-fetch without buffer so toJSON transform returns clean imageUrl
  const result = await Menu.findById(item._id, NO_IMG_DATA);
  created(res, 'Menu berhasil ditambahkan', result);
};

exports.update = async (req, res) => {
  const item = await Menu.findById(req.params.id, { 'image.contentType': 1 });
  if (!item) return notFound(res, 'Menu tidak ditemukan');

  const update = { ...req.body };

  if (req.file) {
    update.image = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
      size: req.file.size,
    };
  }

  await Menu.findByIdAndUpdate(req.params.id, update, { runValidators: true });
  const updated = await Menu.findById(req.params.id, NO_IMG_DATA);
  ok(res, 'Menu berhasil diperbarui', updated);
};

exports.remove = async (req, res) => {
  const item = await Menu.findById(req.params.id, { name: 1 });
  if (!item) return notFound(res, 'Menu tidak ditemukan');
  await item.deleteOne();
  ok(res, 'Menu berhasil dihapus');
};

exports.toggleAvailability = async (req, res) => {
  const item = await Menu.findById(req.params.id, NO_IMG_DATA);
  if (!item) return notFound(res, 'Menu tidak ditemukan');
  item.available = !item.available;
  await item.save();
  ok(res, `Menu ${item.available ? 'diaktifkan' : 'dinonaktifkan'}`, item);
};

exports.bulkUpdateAvailability = async (req, res) => {
  const { ids, available } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return badRequest(res, 'IDs wajib diisi sebagai array');
  }
  await Menu.updateMany({ _id: { $in: ids } }, { available });
  ok(res, `${ids.length} menu berhasil diperbarui`);
};

exports.getCategories = async (req, res) => {
  const categories = await Menu.distinct('category');
  ok(res, 'Kategori menu', categories);
};
