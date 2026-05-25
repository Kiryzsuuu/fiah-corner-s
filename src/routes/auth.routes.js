const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

router.post('/login', validate(schemas.login), ctrl.login);
router.post('/register', validate(schemas.register), ctrl.register);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password', validate(schemas.resetPassword), ctrl.resetPassword);

router.get('/me', authenticate, ctrl.me);
router.put('/me', authenticate, validate(schemas.updateMe), ctrl.updateMe);
router.patch('/password', authenticate, validate(schemas.changePassword), ctrl.changePassword);
router.post('/refresh', authenticate, ctrl.refreshToken);

module.exports = router;
