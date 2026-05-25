const Order = require('../models/Order');
const Setting = require('../models/Setting');
const mailService = require('../services/mail.service');
const waService = require('../services/whatsapp.service');
const { ok, notFound, badRequest, error: errRes } = require('../utils/response');

async function getSettings() {
  return (await Setting.findOne()) || { cafeName: 'Fiah Corner' };
}

exports.sendNotification = async (req, res) => {
  const { orderId, channel, recipientEmail, recipientPhone } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return notFound(res, 'Pesanan tidak ditemukan');

  const settings = await getSettings();
  const results = {};

  const sendEmail = ['email', 'all'].includes(channel);
  const sendWa = ['whatsapp', 'all'].includes(channel);

  if (sendEmail) {
    const to = recipientEmail || order.customerContact?.email;
    if (!to) {
      results.email = { skipped: true, reason: 'Tidak ada email penerima' };
    } else {
      try {
        await mailService.sendOrderReceipt({ to, order, settings });
        await Order.findByIdAndUpdate(orderId, { 'notification.emailSent': true });
        results.email = { success: true, sentTo: to };
      } catch (err) {
        results.email = { success: false, error: err.message };
      }
    }
  }

  if (sendWa) {
    const phone = recipientPhone || order.customerContact?.phone;
    if (!phone) {
      results.whatsapp = { skipped: true, reason: 'Tidak ada nomor WhatsApp penerima' };
    } else {
      try {
        const result = await waService.notifyCustomer({ order, settings, phone });
        await Order.findByIdAndUpdate(orderId, { 'notification.whatsappSent': true });
        results.whatsapp = { success: result.success, ...result };
      } catch (err) {
        results.whatsapp = { success: false, error: err.message };
      }
    }
  }

  ok(res, 'Notifikasi diproses', results);
};

exports.sendAdminAlert = async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return badRequest(res, 'orderId wajib diisi');

  const order = await Order.findById(orderId);
  if (!order) return notFound(res, 'Pesanan tidak ditemukan');

  const settings = await getSettings();
  const results = {};

  try {
    await mailService.sendNewOrderAlert({ order, settings });
    results.email = { success: true };
  } catch (err) {
    results.email = { success: false, error: err.message };
  }

  try {
    const result = await waService.notifyAdmin({ order, settings });
    results.whatsapp = result;
  } catch (err) {
    results.whatsapp = { success: false, error: err.message };
  }

  ok(res, 'Alert admin dikirim', results);
};

exports.testEmail = async (req, res) => {
  try {
    await mailService.verifyConnection();
    ok(res, 'Koneksi email berhasil ✓');
  } catch (err) {
    errRes(res, `Koneksi email gagal: ${err.message}`, 500);
  }
};

exports.testWhatsapp = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return badRequest(res, 'Nomor phone wajib diisi untuk tes');

  try {
    const result = await waService.sendCustomMessage({
      to: phone,
      message: `✅ Tes notifikasi dari Fiah Corner berhasil!\n\nWaktu: ${new Date().toLocaleString('id-ID')}`,
    });
    ok(res, 'Pesan WhatsApp terkirim', result);
  } catch (err) {
    errRes(res, `Kirim WA gagal: ${err.message}`, 500);
  }
};
