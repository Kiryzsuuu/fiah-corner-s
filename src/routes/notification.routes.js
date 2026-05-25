const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

// All notification routes require auth
router.post('/send', authenticate, validate(schemas.sendNotification), ctrl.sendNotification);
router.post('/admin-alert', authenticate, ctrl.sendAdminAlert);
router.post('/test/email', authenticate, ctrl.testEmail);
router.post('/test/whatsapp', authenticate, ctrl.testWhatsapp);

module.exports = router;
