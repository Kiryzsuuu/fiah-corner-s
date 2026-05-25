const nodemailer = require('nodemailer');
const { formatCurrency } = require('../utils/generateOrderNumber');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.MAIL_PORT) || 587,
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }
  return transporter;
}

function buildReceiptHtml(order, settings) {
  const itemsRows = order.items
    .map(
      (it) => `
      <tr>
        <td style="padding:6px 0;">${it.emoji} ${it.name} x${it.quantity}</td>
        <td style="padding:6px 0;text-align:right;">${formatCurrency(it.subtotal)}</td>
      </tr>`
    )
    .join('');

  const customerNames = order.customers.join(', ');

  return `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Struk — ${settings.cafeName}</title></head>
<body style="margin:0;padding:0;background:#faf7f4;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(180,100,120,.12);">
    <div style="background:linear-gradient(135deg,#9e4f6a,#c9748f);color:#fff;padding:28px;text-align:center;">
      <div style="font-size:28px;font-weight:700;letter-spacing:2px;">${settings.cafeName}</div>
      <div style="font-size:12px;letter-spacing:3px;opacity:.85;margin-top:4px;text-transform:uppercase;">${settings.tagline}</div>
    </div>
    <div style="padding:24px 28px;">
      <table style="width:100%;font-size:13px;color:#6b4c3b;">
        <tr><td>No. Pesanan</td><td style="text-align:right;font-weight:700;color:#2c1810;">${order.orderNumber}</td></tr>
        <tr><td>Tanggal</td><td style="text-align:right;">${new Date(order.createdAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</td></tr>
        <tr><td>Meja</td><td style="text-align:right;">${order.table}</td></tr>
        <tr><td>Pembayaran</td><td style="text-align:right;">${order.paymentMethod}</td></tr>
        <tr><td>Atas Nama</td><td style="text-align:right;font-weight:600;">${customerNames}</td></tr>
      </table>

      <hr style="border:none;border-top:1px dashed #e8d5c8;margin:16px 0;">

      <table style="width:100%;font-size:13px;color:#2c1810;">
        ${itemsRows}
      </table>

      <hr style="border:none;border-top:1px dashed #e8d5c8;margin:16px 0;">

      <table style="width:100%;font-size:13px;">
        ${settings.serviceCharge > 0 ? `<tr><td style="color:#6b4c3b;">Service (${settings.serviceCharge}%)</td><td style="text-align:right;">${formatCurrency(order.serviceCharge)}</td></tr>` : ''}
        ${settings.taxRate > 0 ? `<tr><td style="color:#6b4c3b;">Pajak (${settings.taxRate}%)</td><td style="text-align:right;">${formatCurrency(order.tax)}</td></tr>` : ''}
        <tr style="font-size:16px;font-weight:700;color:#9e4f6a;">
          <td style="padding-top:10px;">TOTAL</td>
          <td style="text-align:right;padding-top:10px;">${formatCurrency(order.total)}</td>
        </tr>
      </table>

      ${order.note ? `<div style="margin-top:14px;padding:12px;background:#fdf0f3;border-radius:8px;font-size:12px;color:#9e4f6a;">📝 Catatan: ${order.note}</div>` : ''}
    </div>
    <div style="background:#f5ede6;padding:18px;text-align:center;font-size:12px;color:#a07c6e;line-height:1.8;">
      <div>${settings.address}</div>
      <div style="margin-top:6px;font-weight:700;color:#9e4f6a;font-size:14px;">Terima kasih telah mengunjungi ${settings.cafeName}!</div>
      <div>Semoga harimu menyenangkan ✦</div>
    </div>
  </div>
</body>
</html>`;
}

async function sendOrderReceipt({ to, order, settings }) {
  const html = buildReceiptHtml(order, settings);

  await getTransporter().sendMail({
    from: process.env.MAIL_FROM || `"${settings.cafeName}" <${process.env.MAIL_USER}>`,
    to,
    subject: `Struk Pesanan ${order.orderNumber} — ${settings.cafeName}`,
    html,
  });
}

async function sendNewOrderAlert({ order, settings }) {
  const adminEmail = process.env.ADMIN_EMAIL || settings.notifications?.adminEmail;
  if (!adminEmail) return;

  const itemsList = order.items
    .map((it) => `• ${it.emoji} ${it.name} x${it.quantity} — ${formatCurrency(it.subtotal)}`)
    .join('\n');

  await getTransporter().sendMail({
    from: process.env.MAIL_FROM || `"${settings.cafeName}" <${process.env.MAIL_USER}>`,
    to: adminEmail,
    subject: `🔔 Pesanan Baru ${order.orderNumber} — ${order.table}`,
    text: `Pesanan baru masuk!\n\n${order.orderNumber}\n${order.table}\nAtas nama: ${order.customers.join(', ')}\n\n${itemsList}\n\nTotal: ${formatCurrency(order.total)}\nPembayaran: ${order.paymentMethod}`,
  });
}

async function verifyConnection() {
  await getTransporter().verify();
  return true;
}

module.exports = { sendOrderReceipt, sendNewOrderAlert, verifyConnection };
