const express = require('express');
const multer = require('multer');
const uploadController = require('../controllers/uploadController');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
            return callback(new Error('Only image files are allowed.'));
        }

        callback(null, true);
    }
});

router.post('/', upload.single('image'), uploadController.uploadImage);

module.exports = router;