const prisma = require('../config/db');
const crypto = require('crypto');
const cacheService = require('../services/cache.service');

// In-memory fallback document store for development
const memoryDocuments = new Map();
const memoryCollaborators = new Map();
const memoryVersions = new Map();
let isDbAvailable = true;

// Pre-seed demo documents for Alex and Sarah
const docDemo1 = {
  id: 'doc-arch-001',
  title: 'CollabSpace System Architecture',
  icon: '🚀',
  content: '<h1>CollabSpace System Architecture</h1><p>Welcome to CollabSpace! Start editing in real-time with collaborators.</p>',
  ownerId: 'user-alex-demo-001',
  owner: { id: 'user-alex-demo-001', name: 'Alex Mercer', email: 'alex@collabspace.com' },
  collaborators: [
    { userId: 'user-sarah-demo-002', role: 'EDITOR', user: { id: 'user-sarah-demo-002', name: 'Sarah Connor', email: 'sarah@collabspace.com' } }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const docDemo2 = {
  id: 'doc-notes-002',
  title: 'Engineering Best Practices & Sprint Notes',
  icon: '📚',
  content: '<h2>Team Notes</h2><p>Real-time collaboration enabled with live cursors, typing indicators, and comments.</p>',
  ownerId: 'user-sarah-demo-002',
  owner: { id: 'user-sarah-demo-002', name: 'Sarah Connor', email: 'sarah@collabspace.com' },
  collaborators: [
    { userId: 'user-alex-demo-001', role: 'EDITOR', user: { id: 'user-alex-demo-001', name: 'Alex Mercer', email: 'alex@collabspace.com' } }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

memoryDocuments.set(docDemo1.id, docDemo1);
memoryDocuments.set(docDemo2.id, docDemo2);

const withDbTimeout = (promise, ms = 800) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), ms))
  ]);
};

/**
 * Create a new document
 * POST /api/documents
 */
const createDocument = async (req, res) => {
  try {
    const { title, icon } = req.body;
    const userId = req.user?.id || req.user?.userId;

    const docTitle = title && title.trim() ? title.trim() : 'Untitled Document';
    const docIcon = icon && icon.trim() ? icon.trim() : '📄';

    let newDoc = null;

    if (isDbAvailable) {
      try {
        newDoc = await withDbTimeout(
          prisma.document.create({
            data: {
              title: docTitle,
              icon: docIcon,
              content: '',
              ownerId: userId
            },
            include: {
              owner: {
                select: { id: true, name: true, email: true }
              },
              collaborators: {
                include: {
                  user: { select: { id: true, name: true, email: true } }
                }
              }
            }
          })
        );
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable || !newDoc) {
      const docId = crypto.randomUUID();
      newDoc = {
        id: docId,
        title: docTitle,
        icon: docIcon,
        content: '',
        ownerId: userId,
        owner: {
          id: userId,
          name: req.user?.name || 'User',
          email: req.user?.email || 'user@collabspace.com'
        },
        collaborators: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      memoryDocuments.set(docId, newDoc);
    }

    // Cache new document
    await cacheService.set(`doc:${newDoc.id}`, newDoc, 3600);

    return res.status(201).json({
      status: 'success',
      message: 'Document created successfully',
      document: newDoc
    });
  } catch (error) {
    console.error('Create Document Controller Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create document due to a server error'
    });
  }
};

/**
 * Get all documents for the authenticated user
 * GET /api/documents
 */
const getDocuments = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    let docs = [];

    if (isDbAvailable) {
      try {
        docs = await withDbTimeout(
          prisma.document.findMany({
            where: {
              OR: [
                { ownerId: userId },
                {
                  collaborators: {
                    some: { userId }
                  }
                }
              ]
            },
            include: {
              owner: {
                select: { id: true, name: true, email: true }
              },
              collaborators: {
                include: {
                  user: {
                    select: { id: true, name: true, email: true }
                  }
                }
              }
            },
            orderBy: { updatedAt: 'desc' }
          })
        );
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable) {
      docs = Array.from(memoryDocuments.values())
        .filter(doc => doc.ownerId === userId || (doc.collaborators && doc.collaborators.some(c => c.userId === userId)))
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    return res.status(200).json({
      status: 'success',
      count: docs.length,
      documents: docs
    });
  } catch (error) {
    console.error('Get Documents Controller Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve documents'
    });
  }
};

/**
 * Get a single document by ID (Cache-Aside Pattern)
 * GET /api/documents/:id
 */
const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?.userId;
    const cacheKey = `doc:${id}`;

    // 1. Check Redis Cache First
    const cachedDoc = await cacheService.get(cacheKey);
    if (cachedDoc) {
      const isOwner = cachedDoc.ownerId === userId;
      const isCollaborator = cachedDoc.collaborators && cachedDoc.collaborators.some(c => c.userId === userId);

      if (!isOwner && !isCollaborator) {
        return res.status(403).json({
          status: 'error',
          message: 'Forbidden. You do not have permission to view this document.'
        });
      }

      return res.status(200).json({
        status: 'success',
        document: cachedDoc,
        fromCache: true
      });
    }

    // 2. Cache Miss: Query Database / Memory Store
    let doc = null;

    if (isDbAvailable) {
      try {
        doc = await withDbTimeout(
          prisma.document.findUnique({
            where: { id },
            include: {
              owner: {
                select: { id: true, name: true, email: true }
              },
              collaborators: {
                include: {
                  user: { select: { id: true, name: true, email: true } }
                }
              }
            }
          })
        );
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable) {
      doc = memoryDocuments.get(id) || null;
    }

    if (!doc) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found'
      });
    }

    const isOwner = doc.ownerId === userId;
    const isCollaborator = doc.collaborators && doc.collaborators.some(c => c.userId === userId);

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden. You do not have permission to view this document.'
      });
    }

    // 3. Populate Redis Cache
    await cacheService.set(cacheKey, doc, 3600);

    return res.status(200).json({
      status: 'success',
      document: doc,
      fromCache: false
    });
  } catch (error) {
    console.error('Get Document By ID Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve document details'
    });
  }
};

/**
 * Update a document
 * PUT /api/documents/:id
 */
const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, icon, content } = req.body;
    const userId = req.user?.id || req.user?.userId;

    let doc = null;

    if (isDbAvailable) {
      try {
        doc = await withDbTimeout(
          prisma.document.findUnique({
            where: { id },
            include: { collaborators: true }
          })
        );
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable) {
      doc = memoryDocuments.get(id) || null;
    }

    if (!doc) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found'
      });
    }

    const isOwner = doc.ownerId === userId;
    const collaboration = doc.collaborators ? doc.collaborators.find(c => c.userId === userId) : null;
    const canEdit = isOwner || (collaboration && collaboration.role !== 'VIEWER');

    if (!canEdit) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden. You do not have edit permissions on this document.'
      });
    }

    const updatedData = {
      title: title !== undefined ? title : doc.title,
      icon: icon !== undefined ? icon : doc.icon,
      content: content !== undefined ? content : doc.content,
      updatedAt: new Date()
    };

    let updatedDoc = null;

    if (isDbAvailable) {
      try {
        updatedDoc = await withDbTimeout(
          prisma.document.update({
            where: { id },
            data: updatedData,
            include: {
              owner: {
                select: { id: true, name: true, email: true }
              },
              collaborators: {
                include: {
                  user: { select: { id: true, name: true, email: true } }
                }
              }
            }
          })
        );
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable || !updatedDoc) {
      updatedDoc = {
        ...doc,
        ...updatedData,
        updatedAt: new Date().toISOString()
      };
      memoryDocuments.set(id, updatedDoc);
    }

    // Refresh Redis Cache
    await cacheService.set(`doc:${id}`, updatedDoc, 3600);

    return res.status(200).json({
      status: 'success',
      message: 'Document updated successfully',
      document: updatedDoc
    });
  } catch (error) {
    console.error('Update Document Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update document'
    });
  }
};

/**
 * Share a document with a teammate
 * POST /api/documents/:id/share
 */
const shareDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role = 'EDITOR' } = req.body;
    const userId = req.user?.id || req.user?.userId;

    let doc = null;

    if (isDbAvailable) {
      try {
        doc = await withDbTimeout(
          prisma.document.findUnique({
            where: { id },
            include: { owner: true, collaborators: { include: { user: true } } }
          })
        );
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable) {
      doc = memoryDocuments.get(id) || null;
    }

    if (!doc) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found'
      });
    }

    if (doc.ownerId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the document owner can share this document.'
      });
    }

    const { memoryUsers } = require('./auth.controller');
    let targetUser = null;

    if (isDbAvailable) {
      try {
        targetUser = await withDbTimeout(
          prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: { id: true, name: true, email: true }
          })
        );
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable) {
      targetUser = memoryUsers.get(email.toLowerCase().trim()) || null;
    }

    if (!targetUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User with this email address was not found.'
      });
    }

    if (targetUser.id === doc.ownerId) {
      return res.status(400).json({
        status: 'error',
        message: 'You are already the owner of this document.'
      });
    }

    let collaborator = null;

    if (isDbAvailable) {
      try {
        collaborator = await withDbTimeout(
          prisma.collaborator.upsert({
            where: {
              userId_documentId: {
                userId: targetUser.id,
                documentId: id
              }
            },
            update: { role },
            create: {
              userId: targetUser.id,
              documentId: id,
              role
            },
            include: {
              user: { select: { id: true, name: true, email: true } }
            }
          })
        );
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable || !collaborator) {
      const collabId = crypto.randomUUID();
      collaborator = {
        id: collabId,
        userId: targetUser.id,
        documentId: id,
        role,
        user: { id: targetUser.id, name: targetUser.name, email: targetUser.email },
        createdAt: new Date().toISOString()
      };

      if (!doc.collaborators) doc.collaborators = [];
      const existingIdx = doc.collaborators.findIndex(c => c.userId === targetUser.id);
      if (existingIdx >= 0) {
        doc.collaborators[existingIdx].role = role;
      } else {
        doc.collaborators.push(collaborator);
      }
      memoryDocuments.set(id, doc);
    }

    // Invalidate document cache so updated collaborator list is refreshed
    await cacheService.del(`doc:${id}`);

    return res.status(200).json({
      status: 'success',
      message: `Successfully shared document with ${targetUser.name}`,
      collaborator
    });
  } catch (error) {
    console.error('Share Document Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to share document'
    });
  }
};

/**
 * Update collaborator role
 * PATCH /api/documents/:id/collaborators/:userId
 */
const updateCollaboratorRole = async (req, res) => {
  try {
    const { id, userId: targetUserId } = req.params;
    const { role } = req.body;
    const requesterId = req.user?.id || req.user?.userId;

    let doc = null;

    if (isDbAvailable) {
      try {
        doc = await withDbTimeout(prisma.document.findUnique({ where: { id } }));
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable) {
      doc = memoryDocuments.get(id) || null;
    }

    if (!doc || doc.ownerId !== requesterId) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the document owner can modify collaborator roles.'
      });
    }

    let updatedCollab = null;

    if (isDbAvailable) {
      try {
        updatedCollab = await withDbTimeout(
          prisma.collaborator.update({
            where: {
              userId_documentId: {
                userId: targetUserId,
                documentId: id
              }
            },
            data: { role },
            include: { user: { select: { id: true, name: true, email: true } } }
          })
        );
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable || !updatedCollab) {
      const collab = doc.collaborators?.find(c => c.userId === targetUserId);
      if (collab) {
        collab.role = role;
        updatedCollab = collab;
      }
    }

    await cacheService.del(`doc:${id}`);

    return res.status(200).json({
      status: 'success',
      message: 'Collaborator role updated',
      collaborator: updatedCollab
    });
  } catch (error) {
    console.error('Update Role Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update role'
    });
  }
};

/**
 * Remove collaborator
 * DELETE /api/documents/:id/collaborators/:userId
 */
const removeCollaborator = async (req, res) => {
  try {
    const { id, userId: targetUserId } = req.params;
    const requesterId = req.user?.id || req.user?.userId;

    let doc = null;

    if (isDbAvailable) {
      try {
        doc = await withDbTimeout(prisma.document.findUnique({ where: { id } }));
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable) {
      doc = memoryDocuments.get(id) || null;
    }

    const isOwner = doc?.ownerId === requesterId;
    const isSelf = targetUserId === requesterId;

    if (!isOwner && !isSelf) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to remove this collaborator.'
      });
    }

    if (isDbAvailable) {
      try {
        await withDbTimeout(
          prisma.collaborator.delete({
            where: {
              userId_documentId: {
                userId: targetUserId,
                documentId: id
              }
            }
          })
        );
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable && doc) {
      doc.collaborators = doc.collaborators?.filter(c => c.userId !== targetUserId) || [];
      memoryDocuments.set(id, doc);
    }

    await cacheService.del(`doc:${id}`);

    return res.status(200).json({
      status: 'success',
      message: 'Collaborator removed successfully'
    });
  } catch (error) {
    console.error('Remove Collaborator Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to remove collaborator'
    });
  }
};

/**
 * Delete a document
 * DELETE /api/documents/:id
 */
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?.userId;

    let doc = null;

    if (isDbAvailable) {
      try {
        doc = await withDbTimeout(prisma.document.findUnique({ where: { id } }));
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable) {
      doc = memoryDocuments.get(id) || null;
    }

    if (!doc) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found'
      });
    }

    if (doc.ownerId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the document owner can delete this document.'
      });
    }

    if (isDbAvailable) {
      try {
        await withDbTimeout(prisma.document.delete({ where: { id } }));
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable) {
      memoryDocuments.delete(id);
    }

    // Invalidate Cache
    await cacheService.del(`doc:${id}`);

    return res.status(200).json({
      status: 'success',
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete Document Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete document'
    });
  }
};

module.exports = {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  shareDocument,
  updateCollaboratorRole,
  removeCollaborator,
  deleteDocument,
  memoryDocuments,
  memoryCollaborators,
  memoryVersions
};
