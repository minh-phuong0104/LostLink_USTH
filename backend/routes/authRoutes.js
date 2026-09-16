const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', authController.login);
router.get('/me', requireAuth, requireAdmin, authController.getCurrentUser);

module.exports = router;
