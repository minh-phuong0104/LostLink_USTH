const express = require('express');
const claimController = require('../controllers/claimController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', claimController.createClaim);
router.get('/track/:code', claimController.trackClaim);

router.get('/post/:postId', requireAuth, requireAdmin, claimController.getClaimsForPost);
router.get('/', requireAuth, requireAdmin, claimController.getAllClaims);
router.put('/:id/status', requireAuth, requireAdmin, claimController.updateClaimStatus);

module.exports = router;
