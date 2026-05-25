const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/menu', require('./menu.routes'));
router.use('/orders', require('./order.routes'));
router.use('/settings', require('./setting.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/admins', require('./admin.routes'));

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Fiah Corner API is running ☕',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

module.exports = router;
