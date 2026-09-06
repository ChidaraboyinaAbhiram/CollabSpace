const prisma = require('../config/db');
const crypto = require('crypto');
const { memoryDocuments } = require('./document.controller');

// In-memory fallback version store for development
const memoryVersions = new Map();
let isDbAvailable = true;

const withDbTimeout = (promise, ms = 800) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), ms))
  ]);
};

/**
 * Capture a new version snapshot
 * POST /api/documents/:id/versions
 */
const createVersion = async (req, res) => {
  try {
    const { id: documentId } = req.params;
    const { versionName, name, content } = req.body;
    const userId = req.user?.id || req.user?.userId;

    let doc = null;

    if (isDbAvailable) {
      try {
        doc = await withDbTimeout(
          prisma.document.findUnique({
            where: { id: documentId }
          }),
          400
        );
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable) {
      doc = memoryDocuments.get(documentId) || null;
    }

    if (!doc) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found'
      });
    }

    const versionLabel = (versionName || name) && (versionName || name).trim()
      ? (versionName || name).trim()
      : `Snapshot ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const snapshotContent = content !== undefined ? content : (doc.content || '');

    let newVersion = null;

    if (isDbAvailable) {
      try {
        newVersion = await withDbTimeout(
          prisma.documentVersion.create({
            data: {
              title: doc.title,
              content: snapshotContent,
              versionName: versionLabel,
              documentId,
              createdById: userId
            },
            include: {
              createdBy: {
                select: { id: true, name: true, email: true }
              }
            }
          }),
          400
        );
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable || !newVersion) {
      const versionId = crypto.randomUUID();
      newVersion = {
        id: versionId,
        title: doc.title,
        content: snapshotContent,
        versionName: versionLabel,
        documentId,
        createdById: userId,
        createdBy: {
          id: req.user?.id || req.user?.userId,
          name: req.user?.name || 'User',
          email: req.user?.email || 'user@collabspace.com'
        },
        createdAt: new Date().toISOString()
      };
      memoryVersions.set(versionId, newVersion);
    }

    return res.status(201).json({
      status: 'success',
      message: 'Version snapshot captured successfully',
      version: newVersion
    });
  } catch (error) {
    console.error('Create Version Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create version snapshot'
    });
  }
};

/**
 * List all historical versions for a document
 * GET /api/documents/:id/versions
 */
const getVersions = async (req, res) => {
  try {
    const { id: documentId } = req.params;
    let versions = [];

    if (isDbAvailable) {
      try {
        versions = await withDbTimeout(
          prisma.documentVersion.findMany({
            where: { documentId },
            include: {
              createdBy: {
                select: { id: true, name: true, email: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          })
        );
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable) {
      versions = Array.from(memoryVersions.values())
        .filter((v) => v.documentId === documentId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return res.status(200).json({
      status: 'success',
      count: versions.length,
      versions
    });
  } catch (error) {
    console.error('Get Versions Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve version history'
    });
  }
};

/**
 * Get detailed snapshot for a single version
 * GET /api/documents/:id/versions/:versionId
 */
const getVersionById = async (req, res) => {
  try {
    const { versionId } = req.params;
    let version = null;

    if (isDbAvailable) {
      try {
        version = await withDbTimeout(
          prisma.documentVersion.findUnique({
            where: { id: versionId },
            include: {
              createdBy: {
                select: { id: true, name: true, email: true }
              }
            }
          })
        );
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable) {
      version = memoryVersions.get(versionId) || null;
    }

    if (!version) {
      return res.status(404).json({
        status: 'error',
        message: 'Version snapshot not found'
      });
    }

    return res.status(200).json({
      status: 'success',
      version
    });
  } catch (error) {
    console.error('Get Version Details Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve version details'
    });
  }
};

/**
 * Restore document to a historical version snapshot
 * POST /api/documents/:id/versions/:versionId/restore
 */
const restoreVersion = async (req, res) => {
  try {
    const { id: documentId, versionId } = req.params;
    const userId = req.user?.id || req.user?.userId;

    let targetVersion = null;
    let currentDoc = null;

    if (isDbAvailable) {
      try {
        [targetVersion, currentDoc] = await withDbTimeout(
          Promise.all([
            prisma.documentVersion.findUnique({ where: { id: versionId } }),
            prisma.document.findUnique({ where: { id: documentId } })
          ])
        );
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable) {
      targetVersion = memoryVersions.get(versionId) || null;
      currentDoc = memoryDocuments.get(documentId) || null;
    }

    if (!targetVersion) {
      return res.status(404).json({
        status: 'error',
        message: 'Version snapshot to restore not found'
      });
    }

    if (!currentDoc) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found'
      });
    }

    // 1. Create Pre-Restoration Safety Snapshot
    const backupName = `Pre-Restore Backup (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    let backupVersion = null;

    if (isDbAvailable) {
      try {
        backupVersion = await withDbTimeout(
          prisma.documentVersion.create({
            data: {
              title: currentDoc.title,
              content: currentDoc.content || '',
              versionName: backupName,
              documentId,
              createdById: userId
            }
          })
        );
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable) {
      const bId = crypto.randomUUID();
      backupVersion = {
        id: bId,
        title: currentDoc.title,
        content: currentDoc.content || '',
        versionName: backupName,
        documentId,
        createdById: userId,
        createdAt: new Date().toISOString()
      };
      memoryVersions.set(bId, backupVersion);
    }

    // 2. Update Active Document with Restored State
    let updatedDoc = null;

    if (isDbAvailable) {
      try {
        updatedDoc = await withDbTimeout(
          prisma.document.update({
            where: { id: documentId },
            data: {
              title: targetVersion.title,
              content: targetVersion.content || '',
              updatedAt: new Date()
            },
            include: {
              owner: { select: { id: true, name: true, email: true } },
              collaborators: {
                include: { user: { select: { id: true, name: true, email: true } } }
              }
            }
          })
        );
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable || !updatedDoc) {
      currentDoc.title = targetVersion.title;
      currentDoc.content = targetVersion.content || '';
      currentDoc.updatedAt = new Date().toISOString();
      memoryDocuments.set(documentId, currentDoc);
      updatedDoc = currentDoc;
    }

    return res.status(200).json({
      status: 'success',
      message: `Successfully restored version: "${targetVersion.versionName}"`,
      document: updatedDoc,
      backupVersion
    });
  } catch (error) {
    console.error('Restore Version Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to restore document version'
    });
  }
};

module.exports = {
  createVersion,
  getVersions,
  getVersionById,
  restoreVersion,
  memoryVersions
};
