const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    cafeName: { type: String, default: 'Fiah Corner' },
    tagline: { type: String, default: 'Your Sweet Little Café' },
    address: { type: String, default: 'Jl. Melati No.12, Jakarta' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    logo: {
      data: { type: Buffer },
      contentType: { type: String, default: '' },
    },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    serviceCharge: { type: Number, default: 0, min: 0, max: 100 },
    currency: { type: String, default: 'IDR' },
    tables: {
      type: [String],
      default: ['Meja 1','Meja 2','Meja 3','Meja 4','Meja 5',
                'Meja 6','Meja 7','Meja 8','Meja 9','Meja 10','Take Away'],
    },
    paymentMethods: {
      type: [String],
      default: ['Cash','QRIS','Transfer Bank','GoPay','OVO','Dana','ShopeePay'],
    },
    notifications: {
      emailEnabled: { type: Boolean, default: false },
      whatsappEnabled: { type: Boolean, default: false },
      adminEmail: { type: String, default: '' },
      adminPhone: { type: String, default: '' },
      sendReceiptToCustomer: { type: Boolean, default: true },
    },
    operationalHours: {
      open: { type: String, default: '08:00' },
      close: { type: String, default: '22:00' },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.logoUrl = ret.logo?.contentType ? '/api/settings/logo' : '';
        delete ret.logo;
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('Setting', settingSchema);
