const multer = require('multer')

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
const MAX_SIZE_MB = 15

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(Object.assign(new Error('Invalid file type. Only JPEG, PNG, WEBP, HEIC allowed.'), { type: 'validation' }))
    }
    cb(null, true)
  },
})

module.exports = upload
