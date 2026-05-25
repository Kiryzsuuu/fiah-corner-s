const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    menuId: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu' },
    name: { type: String, required: true },
    emoji: { type: String, default: '🍽' },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    items: {
      type: [orderItemSchema],
      validate: [(v) => v.length > 0, 'Pesanan harus memiliki minimal 1 item'],
    },
    customers: {
      type: [String],
      validate: [(v) => v.length > 0, 'Masukkan minimal 1 nama pelanggan'],
    },
    table: {
      type: String,
      required: [true, 'Nomor meja wajib dipilih'],
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'QRIS', 'Transfer Bank', 'GoPay', 'OVO', 'Dana', 'ShopeePay', 'Lainnya'],
      default: 'Cash',
    },
    note: {
      type: String,
      default: '',
      maxlength: 500,
    },
    subtotal: { type: Number, required: true },
    serviceCharge: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'],
      default: 'pending',
    },
    notification: {
      emailSent: { type: Boolean, default: false },
      whatsappSent: { type: Boolean, default: false },
    },
    customerContact: {
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
