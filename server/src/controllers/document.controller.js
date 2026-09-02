const prisma = require('../config/db');
const crypto = require('crypto');

// In-memory fallback document store for development
const memoryDocuments = new Map();

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
 * Get all documents for the authenticated user
 * GET /api/documents
 */
const getDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    let docs = [];

    try {
      docs = await prisma.document.findMany({
        where: { ownerId: userId },
        orderBy: { updatedAt: 'desc' }
      });
    } catch (dbErr) {
      docs = Array.from(memoryDocuments.values())
        .filter(doc => doc.ownerId === userId)
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
 * Get single document by ID
 * GET /api/documents/:id
 */
const getDocumentById = async (req, res) => {
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

    // Verify ownership
    if (doc.ownerId !== userId) {
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

    // Verify ownership
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

/**
 * Update a document (title, icon, content)
 * PUT /api/documents/:id
 */
const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, icon, content } = req.body;
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

    // Verify ownership
    if (doc.ownerId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden. You do not have permission to update this document.'
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
        data: updatedData
      });
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

module.exports = {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  memoryDocuments
};

