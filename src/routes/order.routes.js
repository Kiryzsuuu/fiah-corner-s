const router = require('express').Router();
const ctrl = require('../controllers/order.controller');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

// Public — create order from POS
router.post('/', validate(schemas.order), ctrl.create);

// Admin protected
router.get('/', authenticate, ctrl.getAll);
router.get('/stats/today', authenticate, ctrl.getTodayStats);
router.get('/stats/range', authenticate, ctrl.getStats);
router.get('/:id', ctrl.getOne);
router.patch('/:id/status', authenticate, validate(schemas.orderStatus), ctrl.updateStatus);

module.exports = router;
