const express = require('express');
const router = express.Router();
const {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  shareDocument,
  updateCollaboratorRole,
  removeCollaborator,
  deleteDocument
} = require('../controllers/document.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Protect all document routes with authentication
router.use(authenticateToken);

// Document CRUD endpoints
router.post('/', createDocument);
router.get('/', getDocuments);
router.get('/:id', getDocumentById);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

// Collaborator and sharing endpoints
router.post('/:id/share', shareDocument);
router.patch('/:id/collaborators/:userId', updateCollaboratorRole);
router.delete('/:id/collaborators/:userId', removeCollaborator);

module.exports = router;
