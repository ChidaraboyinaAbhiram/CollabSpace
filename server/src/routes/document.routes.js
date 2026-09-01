const express = require('express');
const router = express.Router();
const {
  createDocument,
  getDocuments,
  getDocumentById,
  deleteDocument
} = require('../controllers/document.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Protect all document routes with authentication
router.use(authenticateToken);

// Document CRUD endpoints
router.post('/', createDocument);
router.get('/', getDocuments);
router.get('/:id', getDocumentById);
router.delete('/:id', deleteDocument);

module.exports = router;
