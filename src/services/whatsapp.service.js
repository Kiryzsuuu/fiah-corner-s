/**
 * WhatsApp Notification Service
 *
 * Supported providers (set WA_PROVIDER env var):
 *   fonnte    — https://fonnte.com  (popular in Indonesia, free tier)
 *   cloudapi  — WhatsApp Cloud API (Meta official, 1000 free/month)
 *   wablas    — https://wablas.com
 *
 * All adapters expose the same interface:
 *   send({ to, message }) -> Promise<{ success, provider, messageId }>
 */

const axios = require('axios');
const { formatCurrency } = require('../utils/generateOrderNumber');

// ─── Provider Adapters ───────────────────────────────────────────────────────

const fonnte = {
  async send({ to, message }) {
    const phone = normalizePhone(to);
    const res = await axios.post(
      'https://api.fonnte.com/send',
      { target: phone, message, countryCode: '62' },
      {
        headers: {
          Authorization: process.env.FONNTE_TOKEN,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    return { success: res.data.status === true, provider: 'fonnte', raw: res.data };
  },
};

const cloudapi = {
  async send({ to, message }) {
    const phone = normalizePhone(to);
    const url = `https://graph.facebook.com/${process.env.WA_CLOUD_VERSION}/${process.env.WA_CLOUD_PHONE_ID}/messages`;
    const res = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WA_CLOUD_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    return {
      success: !!res.data.messages?.[0]?.id,
      provider: 'cloudapi',
      messageId: res.data.messages?.[0]?.id,
    };
  },
};

const wablas = {
  async send({ to, message }) {
    const phone = normalizePhone(to);
    const res = await axios.post(
      'https://solo.wablas.com/api/send-message',
      { phone, message },
      {
        headers: {
          Authorization: process.env.WABLAS_TOKEN,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    return { success: res.data.status, provider: 'wablas', raw: res.data };
  },
};

const adapters = { fonnte, cloudapi, wablas };

// ─── Core ────────────────────────────────────────────────────────────────────

function getAdapter() {
  const provider = (process.env.WA_PROVIDER || 'fonnte').toLowerCase();
  const adapter = adapters[provider];
  if (!adapter) throw new Error(`Provider WhatsApp "${provider}" tidak dikenal`);
  return adapter;
}

function normalizePhone(phone) {
  return phone.replace(/\D/g, '').replace(/^0/, '62');
}

// ─── Message Templates ───────────────────────────────────────────────────────

function buildOrderConfirmation(order, settings) {
  const items = order.items.map((it) => `  • ${it.emoji} ${it.name} x${it.quantity}`).join('\n');
  return (
    `✅ *Pesanan Dikonfirmasi — ${settings.cafeName}*\n\n` +
    `Halo, ${order.customers.join(' & ')}! 🎉\n` +
    `Pesanan kalian sudah kami terima.\n\n` +
    `📋 No. Pesanan: *${order.orderNumber}*\n` +
    `🪑 Meja: ${order.table}\n\n` +
    `*Detail Pesanan:*\n${items}\n\n` +
    `💰 Total: *${formatCurrency(order.total)}*\n` +
    `💳 Pembayaran: ${order.paymentMethod}\n` +
    (order.note ? `📝 Catatan: ${order.note}\n\n` : '\n') +
    `_Terima kasih sudah mengunjungi ${settings.cafeName}!_ ✦`
  );
}

function buildAdminAlert(order, settings) {
  const items = order.items
    .map((it) => `  ${it.emoji} ${it.name} x${it.quantity} — ${formatCurrency(it.subtotal)}`)
    .join('\n');
  return (
    `🔔 *Pesanan Baru — ${settings.cafeName}*\n\n` +
    `📋 No: *${order.orderNumber}*\n` +
    `🕐 ${new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}\n` +
    `🪑 Meja: ${order.table}\n` +
    `👥 Atas nama: ${order.customers.join(', ')}\n\n` +
    `*Detail Pesanan:*\n${items}\n\n` +
    `💰 Total: *${formatCurrency(order.total)}*\n` +
    `💳 Bayar via: ${order.paymentMethod}` +
    (order.note ? `\n📝 Catatan: ${order.note}` : '')
  );
}

function buildStatusUpdate(order, settings) {
  const statusEmoji = { preparing: '👨‍🍳', ready: '✅', completed: '🎉', cancelled: '❌' };
  const statusText = { preparing: 'Sedang disiapkan', ready: 'Siap diambil!', completed: 'Selesai', cancelled: 'Dibatalkan' };
  return (
    `${statusEmoji[order.status] || '📋'} *Update Pesanan — ${settings.cafeName}*\n\n` +
    `Pesanan *${order.orderNumber}* status: *${statusText[order.status] || order.status}*\n` +
    `👥 ${order.customers.join(', ')} — ${order.table}`
  );
}

// ─── Public API ──────────────────────────────────────────────────────────────

async function notifyCustomer({ order, settings, phone }) {
  const to = phone || order.customerContact?.phone;
  if (!to) return { skipped: true, reason: 'no_phone' };
  const message = buildOrderConfirmation(order, settings);
  return getAdapter().send({ to, message });
}

async function notifyAdmin({ order, settings }) {
  const to = process.env.ADMIN_WA_NUMBER || settings.notifications?.adminPhone;
  if (!to) return { skipped: true, reason: 'no_admin_phone' };
  const message = buildAdminAlert(order, settings);
  return getAdapter().send({ to, message });
}

async function notifyStatusUpdate({ order, settings, phone }) {
  const to = phone || order.customerContact?.phone;
  if (!to) return { skipped: true, reason: 'no_phone' };
  const message = buildStatusUpdate(order, settings);
  return getAdapter().send({ to, message });
}

async function sendCustomMessage({ to, message }) {
  return getAdapter().send({ to, message });
}

module.exports = {
  notifyCustomer,
  notifyAdmin,
  notifyStatusUpdate,
  sendCustomMessage,
};
