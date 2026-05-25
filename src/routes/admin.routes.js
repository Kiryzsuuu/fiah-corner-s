const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const ctrl = require('../controllers/admin.controller');

router.use(authenticate, authorize('superadmin'));

router.get('/', ctrl.getAll);
router.post('/', validate(schemas.createAdmin), ctrl.create);
router.patch('/:id/role', validate(schemas.updateRole), ctrl.updateRole);
router.delete('/:id', ctrl.remove);

module.exports = router;
