const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../middleware/auth.middleware');
const {
  createComment,
  getComments,
  resolveComment,
  deleteComment
} = require('../controllers/comment.controller');

// All comment endpoints are protected by JWT authentication
router.use(authenticateToken);

// Create comment or reply
router.post('/', createComment);

// List all comments for the document
router.get('/', getComments);

// Toggle resolve status
router.patch('/:commentId/resolve', resolveComment);

// Delete comment
router.delete('/:commentId', deleteComment);

module.exports = router;
