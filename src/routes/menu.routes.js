const router = require('express').Router();
const ctrl = require('../controllers/menu.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { upload, handleUploadError } = require('../middleware/upload');

// Public
router.get('/', ctrl.getAll);
router.get('/categories', ctrl.getCategories);
router.get('/:id/image', ctrl.getImage);
router.get('/:id', ctrl.getOne);

// Admin protected
router.post(
  '/',
  authenticate,
  upload.single('image'),
  handleUploadError,
  validate(schemas.menu),
  ctrl.create
);

router.put(
  '/:id',
  authenticate,
  upload.single('image'),
  handleUploadError,
  validate(schemas.menu),
  ctrl.update
);

router.patch(
  '/:id',
  authenticate,
  upload.single('image'),
  handleUploadError,
  validate(schemas.menuPatch),
  ctrl.update
);

router.patch('/:id/availability', authenticate, ctrl.toggleAvailability);
router.patch('/bulk/availability', authenticate, ctrl.bulkUpdateAvailability);
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), ctrl.remove);

module.exports = router;
