const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

router.post('/login', validate(schemas.login), ctrl.login);
router.get('/me', authenticate, ctrl.me);
router.post('/refresh', authenticate, ctrl.refreshToken);
router.patch('/password', authenticate, ctrl.changePassword);

module.exports = router;
