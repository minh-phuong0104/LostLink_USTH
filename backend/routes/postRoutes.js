const express = require('express');
const postController = require('../controllers/postController');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', postController.getPosts);
router.get('/mine', postController.getMyPosts);
router.get('/:id', postController.getPostById);
router.post('/', postController.createPost);
router.put('/:id', optionalAuth, postController.updatePost);
router.patch('/:id/status', optionalAuth, postController.updateOwnPostStatus);
router.delete('/:id', optionalAuth, postController.deletePost);

module.exports = router;
