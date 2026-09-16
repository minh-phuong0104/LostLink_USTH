const express = require('express');
const securityController = require('../controllers/securityController');
const { optionalAuth, requireAuth, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', optionalAuth, securityController.createSecurityReport);
router.get('/my', requireAuth, securityController.getMySecurityReports);
router.get('/track/:code', securityController.trackSecurityReport);
router.get('/', requireAuth, requireAdmin, securityController.getAllSecurityReports);
router.put('/:id/status', requireAuth, requireAdmin, securityController.updateSecurityReport);

module.exports = router;
