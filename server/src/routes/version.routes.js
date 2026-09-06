const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../middleware/auth.middleware');
const {
  createVersion,
  getVersions,
  getVersionById,
  restoreVersion
} = require('../controllers/version.controller');

// All version routes require JWT authentication
router.use(authenticateToken);

// Create snapshot
router.post('/', createVersion);

// List all versions
router.get('/', getVersions);

// Get single version details
router.get('/:versionId', getVersionById);

// Restore document to version
router.post('/:versionId/restore', restoreVersion);

module.exports = router;
