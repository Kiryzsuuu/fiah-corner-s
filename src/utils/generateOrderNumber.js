const Order = require('../models/Order');

async function generateOrderNumber() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const count = await Order.countDocuments({
    createdAt: { $gte: startOfDay, $lt: endOfDay },
  });

  const seq = String(count + 1).padStart(3, '0');
  return `FC-${datePart}-${seq}`;
}

const formatCurrency = (amount, currency = 'IDR') =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);

module.exports = { generateOrderNumber, formatCurrency };
