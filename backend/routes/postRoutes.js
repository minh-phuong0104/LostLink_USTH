const express = require('express');
const postController = require('../controllers/postController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', postController.getPosts);
router.get('/mine', requireAuth, postController.getMyPosts);
router.get('/:id', postController.getPostById);
router.post('/', requireAuth, postController.createPost);
router.put('/:id', requireAuth, postController.updatePost);
router.patch('/:id/status', requireAuth, postController.updateOwnPostStatus);
router.delete('/:id', requireAuth, postController.deletePost);

module.exports = router;
