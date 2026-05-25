const Joi = require('joi');
const { badRequest } = require('../utils/response');

const validate = (schema, target = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[target], {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    const messages = error.details.map((d) => d.message.replace(/"/g, ''));
    return badRequest(res, 'Validasi gagal', messages);
  }

  req[target] = value;
  next();
};

// ─── Schemas ────────────────────────────────────────────────────────────────

const schemas = {
  login: Joi.object({
    username: Joi.string().required().messages({ 'any.required': 'Username wajib diisi' }),
    password: Joi.string().required().messages({ 'any.required': 'Password wajib diisi' }),
  }),

  menu: Joi.object({
    name: Joi.string().trim().max(100).required(),
    category: Joi.string().trim().required(),
    price: Joi.number().min(0).required(),
    description: Joi.string().trim().max(300).allow('').default(''),
    emoji: Joi.string().max(10).allow('').default('🍽'),
    available: Joi.boolean().default(true),
    featured: Joi.boolean().default(false),
    sortOrder: Joi.number().default(0),
  }),

  menuPatch: Joi.object({
    name: Joi.string().trim().max(100),
    category: Joi.string().trim(),
    price: Joi.number().min(0),
    description: Joi.string().trim().max(300).allow(''),
    emoji: Joi.string().max(10).allow(''),
    available: Joi.boolean(),
    featured: Joi.boolean(),
    sortOrder: Joi.number(),
  }).min(1),

  order: Joi.object({
    items: Joi.array()
      .items(
        Joi.object({
          menuId: Joi.string().required(),
          name: Joi.string().required(),
          emoji: Joi.string().allow('').default('🍽'),
          price: Joi.number().min(0).required(),
          quantity: Joi.number().integer().min(1).required(),
          subtotal: Joi.number().min(0).required(),
        })
      )
      .min(1)
      .required(),
    customers: Joi.array().items(Joi.string().trim().min(1)).min(1).required(),
    table: Joi.string().required(),
    paymentMethod: Joi.string()
      .valid('Cash', 'QRIS', 'Transfer Bank', 'GoPay', 'OVO', 'Dana', 'ShopeePay', 'Lainnya')
      .default('Cash'),
    note: Joi.string().max(500).allow('').default(''),
    customerContact: Joi.object({
      email: Joi.string().email().allow('').default(''),
      phone: Joi.string().allow('').default(''),
    }).default({}),
  }),

  orderStatus: Joi.object({
    status: Joi.string()
      .valid('pending', 'preparing', 'ready', 'completed', 'cancelled')
      .required(),
  }),

  settings: Joi.object({
    cafeName: Joi.string().max(100),
    tagline: Joi.string().max(200),
    address: Joi.string().max(300),
    phone: Joi.string().allow(''),
    email: Joi.string().email().allow(''),
    taxRate: Joi.number().min(0).max(100),
    serviceCharge: Joi.number().min(0).max(100),
    currency: Joi.string().max(10),
    tables: Joi.array().items(Joi.string()),
    paymentMethods: Joi.array().items(Joi.string()),
    notifications: Joi.object({
      emailEnabled: Joi.boolean(),
      whatsappEnabled: Joi.boolean(),
      adminEmail: Joi.string().email().allow(''),
      adminPhone: Joi.string().allow(''),
      sendReceiptToCustomer: Joi.boolean(),
    }),
    operationalHours: Joi.object({
      open: Joi.string(),
      close: Joi.string(),
    }),
  }).min(1),

  sendNotification: Joi.object({
    orderId: Joi.string().required(),
    channel: Joi.string().valid('email', 'whatsapp', 'all').default('all'),
    recipientEmail: Joi.string().email().allow(''),
    recipientPhone: Joi.string().allow(''),
  }),
};

module.exports = { validate, schemas };
