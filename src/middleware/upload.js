const multer = require('multer');
const { badRequest } = require('../utils/response');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.'));
    }
    cb(null, true);
  },
});

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return badRequest(res, 'Ukuran file maksimal 5MB');
    }
    return badRequest(res, err.message);
  }
  if (err) return badRequest(res, err.message);
  next();
};

module.exports = { upload, handleUploadError };
