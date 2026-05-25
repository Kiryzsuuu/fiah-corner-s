const Setting = require('../models/Setting');
const { ok } = require('../utils/response');

const NO_LOGO_DATA = { 'logo.data': 0 };

async function getOrCreate() {
  let setting = await Setting.findOne({}, NO_LOGO_DATA);
  if (!setting) setting = await Setting.create({});
  return setting;
}

exports.get = async (req, res) => {
  const setting = await getOrCreate();
  ok(res, 'Pengaturan kafe', setting);
};

exports.update = async (req, res) => {
  let setting = await Setting.findOne();
  if (!setting) setting = new Setting();
  Object.assign(setting, req.body);
  await setting.save();
  const result = await Setting.findById(setting._id, NO_LOGO_DATA);
  ok(res, 'Pengaturan berhasil disimpan', result);
};

// Stream stored logo — public, no auth
exports.getLogo = async (req, res) => {
  const setting = await Setting.findOne({}, { 'logo.data': 1, 'logo.contentType': 1 });
  if (!setting?.logo?.data || !setting.logo.contentType) {
    return res.status(404).end();
  }
  res.set('Content-Type', setting.logo.contentType);
  res.set('Cache-Control', 'public, max-age=604800');
  res.send(setting.logo.data);
};

exports.uploadLogo = async (req, res) => {
  let setting = await Setting.findOne();
  if (!setting) setting = new Setting();

  setting.logo = {
    data: req.file.buffer,
    contentType: req.file.mimetype,
  };
  await setting.save();

  ok(res, 'Logo berhasil diupload', { logoUrl: '/api/settings/logo' });
};
