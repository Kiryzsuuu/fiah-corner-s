const Order = require('../models/Order');
const Setting = require('../models/Setting');
const { generateOrderNumber } = require('../utils/generateOrderNumber');
const mailService = require('../services/mail.service');
const waService = require('../services/whatsapp.service');
const { ok, created, notFound, badRequest } = require('../utils/response');

async function getSettings() {
  return Setting.findOne() || { cafeName: 'Fiah Corner', taxRate: 0, serviceCharge: 0 };
}

exports.create = async (req, res) => {
  const settings = await getSettings();
  const { items, customers, table, paymentMethod, note, customerContact } = req.body;

  const subtotal = items.reduce((sum, it) => sum + it.subtotal, 0);
  const serviceCharge = Math.round(subtotal * ((settings.serviceCharge || 0) / 100));
  const tax = Math.round((subtotal + serviceCharge) * ((settings.taxRate || 0) / 100));
  const total = subtotal + serviceCharge + tax;

  const orderNumber = await generateOrderNumber();

  const order = await Order.create({
    orderNumber,
    items,
    customers,
    table,
    paymentMethod,
    note,
    customerContact,
    subtotal,
    serviceCharge,
    tax,
    total,
  });

  // Send notifications in background — don't block response
  setImmediate(async () => {
    const notifConfig = settings.notifications || {};

    if (notifConfig.whatsappEnabled) {
      try {
        await waService.notifyAdmin({ order, settings });
        if (notifConfig.sendReceiptToCustomer && order.customerContact?.phone) {
          await waService.notifyCustomer({ order, settings });
        }
        await Order.findByIdAndUpdate(order._id, { 'notification.whatsappSent': true });
      } catch (err) {
        console.error('[WA] Notification error:', err.message);
      }
    }

    if (notifConfig.emailEnabled) {
      try {
        await mailService.sendNewOrderAlert({ order, settings });
        if (notifConfig.sendReceiptToCustomer && order.customerContact?.email) {
          await mailService.sendOrderReceipt({ to: order.customerContact.email, order, settings });
        }
        await Order.findByIdAndUpdate(order._id, { 'notification.emailSent': true });
      } catch (err) {
        console.error('[Mail] Notification error:', err.message);
      }
    }
  });

  created(res, 'Pesanan berhasil dibuat', order);
};

exports.getAll = async (req, res) => {
  const { status, date, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (status) filter.status = status;

  if (date) {
    const d = new Date(date);
    filter.createdAt = {
      $gte: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
      $lt: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
    };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Order.countDocuments(filter),
  ]);

  ok(res, 'Data pesanan', orders, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / parseInt(limit)),
  });
};

exports.getOne = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return notFound(res, 'Pesanan tidak ditemukan');
  ok(res, 'Detail pesanan', order);
};

exports.updateStatus = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return notFound(res, 'Pesanan tidak ditemukan');

  const { status } = req.body;
  order.status = status;
  await order.save();

  // Notify customer on status change
  setImmediate(async () => {
    const settings = await getSettings();
    if (settings?.notifications?.whatsappEnabled && order.customerContact?.phone) {
      try {
        await waService.notifyStatusUpdate({ order, settings });
      } catch (err) {
        console.error('[WA] Status update error:', err.message);
      }
    }
  });

  ok(res, `Status pesanan diperbarui ke "${status}"`, order);
};

exports.getTodayStats = async (req, res) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const [orders, revenueAgg] = await Promise.all([
    Order.find({ createdAt: { $gte: startOfDay, $lt: endOfDay } }).lean(),
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfDay, $lt: endOfDay }, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
  ]);

  const revenue = revenueAgg[0]?.total || 0;
  const count = revenueAgg[0]?.count || 0;

  const byStatus = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const topItems = {};
  orders.forEach((o) => {
    o.items.forEach((it) => {
      if (!topItems[it.name]) topItems[it.name] = { name: it.name, emoji: it.emoji, qty: 0, revenue: 0 };
      topItems[it.name].qty += it.quantity;
      topItems[it.name].revenue += it.subtotal;
    });
  });

  const topItemsSorted = Object.values(topItems).sort((a, b) => b.qty - a.qty).slice(0, 5);

  ok(res, 'Statistik hari ini', { revenue, count, byStatus, topItems: topItemsSorted });
};

exports.getStats = async (req, res) => {
  const { from, to } = req.query;
  const start = from ? new Date(from) : new Date(new Date().setDate(new Date().getDate() - 30));
  const end = to ? new Date(to) : new Date();

  const agg = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  ok(res, 'Statistik penjualan', agg);
};
