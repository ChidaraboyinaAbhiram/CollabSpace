const prisma = require('../config/db');
const crypto = require('crypto');

// In-memory fallback stores for development
const memoryDocuments = new Map();
const memoryCollaborators = new Map();
const memoryVersions = new Map();

/**
 * Create a new document
 * POST /api/documents
 */
const createDocument = async (req, res) => {
  try {
    const { title, icon } = req.body;
    const userId = req.user.id;

    const docTitle = title && title.trim() ? title.trim() : 'Untitled Document';
    const docIcon = icon && icon.trim() ? icon.trim() : '📄';

    let newDoc = null;
    let isDbAvailable = true;

    try {
      newDoc = await prisma.document.create({
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
      });
    } catch (dbErr) {
      isDbAvailable = false;
      const docId = crypto.randomUUID();
      newDoc = {
        id: docId,
        title: docTitle,
        icon: docIcon,
        content: '',
        ownerId: userId,
        owner: { id: req.user.id, name: req.user.name, email: req.user.email },
        collaborators: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      memoryDocuments.set(docId, newDoc);
    }

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
 * Get all documents for the authenticated user (owned + collaborated)
 * GET /api/documents
 */
const getDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    let docs = [];

    try {
      docs = await prisma.document.findMany({
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
      });
    } catch (dbErr) {
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
 * Get single document by ID with collaborator and version relations
 * GET /api/documents/:id
 */
const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    let doc = null;

    try {
      doc = await prisma.document.findUnique({
        where: { id },
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
          },
          versions: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });
    } catch (dbErr) {
      doc = memoryDocuments.get(id) || null;
    }

    if (!doc) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found'
      });
    }

    // Verify access: Owner or Collaborator
    const isOwner = doc.ownerId === userId;
    const isCollaborator = doc.collaborators && doc.collaborators.some(c => c.userId === userId);

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You do not have permission to view this document.'
      });
    }

    return res.status(200).json({
      status: 'success',
      document: doc
    });
  } catch (error) {
    console.error('Get Document By ID Controller Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve document details'
    });
  }
};

/**
 * Update a document (title, icon, content) and optionally create version snapshot
 * PUT /api/documents/:id
 */
const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, icon, content, createSnapshot } = req.body;
    const userId = req.user.id;

    let doc = null;

    try {
      doc = await prisma.document.findUnique({
        where: { id },
        include: { collaborators: true }
      });
    } catch (dbErr) {
      doc = memoryDocuments.get(id) || null;
    }

    if (!doc) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found'
      });
    }

    // Verify write permission: Owner or Editor/Admin Collaborator
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

    try {
      updatedDoc = await prisma.document.update({
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
      });

      if (createSnapshot && updatedData.content) {
        await prisma.documentVersion.create({
          data: {
            title: `${updatedData.title} (Snapshot)`,
            content: updatedData.content,
            documentId: id
          }
        });
      }
    } catch (dbErr) {
      updatedDoc = {
        ...doc,
        ...updatedData,
        updatedAt: new Date().toISOString()
      };
      memoryDocuments.set(id, updatedDoc);
    }

    return res.status(200).json({
      status: 'success',
      message: 'Document updated successfully',
      document: updatedDoc
    });
  } catch (error) {
    console.error('Update Document Controller Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update document'
    });
  }
};

/**
 * Share document with a user by email
 * POST /api/documents/:id/share
 */
const shareDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;
    const requesterId = req.user.id;

    if (!email || !email.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Collaborator email is required'
      });
    }

    const assignedRole = role === 'VIEWER' ? 'VIEWER' : 'EDITOR';

    let doc = null;
    try {
      doc = await prisma.document.findUnique({
        where: { id },
        include: { owner: true }
      });
    } catch (dbErr) {
      doc = memoryDocuments.get(id) || null;
    }

    if (!doc) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found'
      });
    }

    // Only owner can share document
    if (doc.ownerId !== requesterId) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden. Only the document owner can manage collaborators.'
      });
    }

    // Check if trying to share with owner
    if (doc.owner.email.toLowerCase() === email.toLowerCase().trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'The document owner already has full access.'
      });
    }

    let targetUser = null;
    try {
      targetUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      });
    } catch (dbErr) {
      // Memory fallback target user
      targetUser = {
        id: crypto.randomUUID(),
        name: email.split('@')[0],
        email: email.toLowerCase().trim()
      };
    }

    if (!targetUser) {
      return res.status(404).json({
        status: 'error',
        message: `No user found with email ${email}`
      });
    }

    let collaborator = null;

    try {
      collaborator = await prisma.collaborator.upsert({
        where: {
          userId_documentId: {
            userId: targetUser.id,
            documentId: id
          }
        },
        update: {
          role: assignedRole
        },
        create: {
          userId: targetUser.id,
          documentId: id,
          role: assignedRole
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });
    } catch (dbErr) {
      collaborator = {
        id: crypto.randomUUID(),
        userId: targetUser.id,
        documentId: id,
        role: assignedRole,
        user: targetUser,
        createdAt: new Date().toISOString()
      };

      if (!doc.collaborators) doc.collaborators = [];
      const existingIdx = doc.collaborators.findIndex(c => c.userId === targetUser.id);
      if (existingIdx >= 0) {
        doc.collaborators[existingIdx] = collaborator;
      } else {
        doc.collaborators.push(collaborator);
      }
      memoryDocuments.set(id, doc);
    }

    return res.status(200).json({
      status: 'success',
      message: `Successfully shared with ${targetUser.name || email}`,
      collaborator
    });
  } catch (error) {
    console.error('Share Document Controller Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to share document'
    });
  }
};

/**
 * Update a collaborator's role
 * PATCH /api/documents/:id/collaborators/:userId
 */
const updateCollaboratorRole = async (req, res) => {
  try {
    const { id, userId: targetUserId } = req.params;
    const { role } = req.body;
    const requesterId = req.user.id;

    const assignedRole = role === 'VIEWER' ? 'VIEWER' : 'EDITOR';

    let doc = null;
    try {
      doc = await prisma.document.findUnique({ where: { id } });
    } catch (dbErr) {
      doc = memoryDocuments.get(id) || null;
    }

    if (!doc || doc.ownerId !== requesterId) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden. Only the document owner can update roles.'
      });
    }

    let updatedCollaborator = null;

    try {
      updatedCollaborator = await prisma.collaborator.update({
        where: {
          userId_documentId: {
            userId: targetUserId,
            documentId: id
          }
        },
        data: { role: assignedRole },
        include: {
          user: { select: { id: true, name: true, email: true } }
        }
      });
    } catch (dbErr) {
      if (doc.collaborators) {
        const c = doc.collaborators.find(col => col.userId === targetUserId);
        if (c) {
          c.role = assignedRole;
          updatedCollaborator = c;
        }
      }
    }

    return res.status(200).json({
      status: 'success',
      message: 'Collaborator role updated',
      collaborator: updatedCollaborator
    });
  } catch (error) {
    console.error('Update Collaborator Role Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update collaborator role'
    });
  }
};

/**
 * Remove a collaborator from document
 * DELETE /api/documents/:id/collaborators/:userId
 */
const removeCollaborator = async (req, res) => {
  try {
    const { id, userId: targetUserId } = req.params;
    const requesterId = req.user.id;

    let doc = null;
    try {
      doc = await prisma.document.findUnique({ where: { id } });
    } catch (dbErr) {
      doc = memoryDocuments.get(id) || null;
    }

    // Owner or user removing themselves
    const isOwner = doc && doc.ownerId === requesterId;
    const isSelf = requesterId === targetUserId;

    if (!isOwner && !isSelf) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden. You do not have permission to remove this collaborator.'
      });
    }

    try {
      await prisma.collaborator.delete({
        where: {
          userId_documentId: {
            userId: targetUserId,
            documentId: id
          }
        }
      });
    } catch (dbErr) {
      if (doc && doc.collaborators) {
        doc.collaborators = doc.collaborators.filter(c => c.userId !== targetUserId);
        memoryDocuments.set(id, doc);
      }
    }

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
    const userId = req.user.id;

    let doc = null;

    try {
      doc = await prisma.document.findUnique({
        where: { id }
      });
    } catch (dbErr) {
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
        message: 'Forbidden. Only the owner can delete this document.'
      });
    }

    try {
      await prisma.document.delete({
        where: { id }
      });
    } catch (dbErr) {
      memoryDocuments.delete(id);
    }

    return res.status(200).json({
      status: 'success',
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete Document Controller Error:', error);
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
