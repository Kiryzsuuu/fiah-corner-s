const router = require('express').Router();
const ctrl = require('../controllers/setting.controller');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { upload, handleUploadError } = require('../middleware/upload');

// Public
router.get('/', ctrl.get);
router.get('/logo', ctrl.getLogo);

// Admin protected
router.put('/', authenticate, validate(schemas.settings), ctrl.update);
router.patch('/', authenticate, validate(schemas.settings), ctrl.update);
router.post(
  '/logo',
  authenticate,
  upload.single('logo'),
  handleUploadError,
  ctrl.uploadLogo
);

module.exports = router;
