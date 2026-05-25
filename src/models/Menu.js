const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nama menu wajib diisi'],
      trim: true,
      maxlength: [100, 'Nama menu maksimal 100 karakter'],
    },
    category: {
      type: String,
      required: [true, 'Kategori wajib diisi'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Harga wajib diisi'],
      min: [0, 'Harga tidak boleh negatif'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Deskripsi maksimal 300 karakter'],
      default: '',
    },
    emoji: {
      type: String,
      default: '🍽',
      maxlength: 10,
    },
    image: {
      data: { type: Buffer },
      contentType: { type: String, default: '' },
      size: { type: Number, default: 0 },
    },
    available: {
      type: Boolean,
      default: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        // Replace raw buffer with a URL — never expose binary in JSON
        ret.imageUrl = ret.image?.contentType
          ? `/api/menu/${doc._id}/image`
          : '';
        delete ret.image;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

menuSchema.index({ category: 1, available: 1 });
menuSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Menu', menuSchema);
