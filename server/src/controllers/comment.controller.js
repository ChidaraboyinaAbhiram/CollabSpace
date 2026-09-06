const prisma = require('../config/db');
const crypto = require('crypto');

// In-memory fallback comment store for development
const memoryComments = new Map();
let isDbAvailable = true;

const withDbTimeout = (promise, ms = 800) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), ms))
  ]);
};

/**
 * Create a comment or reply
 * POST /api/documents/:id/comments
 */
const createComment = async (req, res) => {
  try {
    const { id: documentId } = req.params;
    const { content, highlightedText, startIndex, endIndex, parentId } = req.body;
    const authorId = req.user?.id || req.user?.userId;

    if (!content || !content.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Comment content is required'
      });
    }

    let newComment = null;

    if (isDbAvailable) {
      try {
        newComment = await withDbTimeout(
          prisma.comment.create({
            data: {
              content: content.trim(),
              highlightedText: highlightedText || null,
              startIndex: typeof startIndex === 'number' ? startIndex : null,
              endIndex: typeof endIndex === 'number' ? endIndex : null,
              parentId: parentId || null,
              documentId,
              authorId
            },
            include: {
              author: {
                select: { id: true, name: true, email: true }
              },
              replies: {
                include: {
                  author: { select: { id: true, name: true, email: true } }
                }
              }
            }
          })
        );
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!newComment) {
      const commentId = crypto.randomUUID();
      newComment = {
        id: commentId,
        content: content.trim(),
        highlightedText: highlightedText || null,
        startIndex: typeof startIndex === 'number' ? startIndex : null,
        endIndex: typeof endIndex === 'number' ? endIndex : null,
        resolved: false,
        parentId: parentId || null,
        documentId,
        authorId,
        author: {
          id: req.user?.id || req.user?.userId,
          name: req.user?.name || 'User',
          email: req.user?.email || 'user@collabspace.com'
        },
        replies: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      memoryComments.set(commentId, newComment);
    }

    return res.status(201).json({
      status: 'success',
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Create Comment Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create comment'
    });
  }
};

/**
 * Get all comments for a document
 * GET /api/documents/:id/comments
 */
const getComments = async (req, res) => {
  try {
    const { id: documentId } = req.params;
    let comments = [];

    if (isDbAvailable) {
      try {
        comments = await withDbTimeout(
          prisma.comment.findMany({
            where: {
              documentId,
              parentId: null
            },
            include: {
              author: {
                select: { id: true, name: true, email: true }
              },
              replies: {
                include: {
                  author: { select: { id: true, name: true, email: true } }
                },
                orderBy: { createdAt: 'asc' }
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
      const allComments = Array.from(memoryComments.values()).filter(
        (c) => c.documentId === documentId
      );

      const topLevel = allComments.filter((c) => !c.parentId);
      topLevel.forEach((parent) => {
        parent.replies = allComments
          .filter((c) => c.parentId === parent.id)
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });

      comments = topLevel.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return res.status(200).json({
      status: 'success',
      count: comments.length,
      comments
    });
  } catch (error) {
    console.error('Get Comments Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve comments'
    });
  }
};

/**
 * Toggle comment resolved status
 * PATCH /api/documents/:id/comments/:commentId/resolve
 */
const resolveComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { resolved } = req.body;

    let targetComment = null;

    if (isDbAvailable) {
      try {
        targetComment = await withDbTimeout(
          prisma.comment.findUnique({
            where: { id: commentId }
          })
        );
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable) {
      targetComment = memoryComments.get(commentId) || null;
    }

    if (!targetComment) {
      return res.status(404).json({
        status: 'error',
        message: 'Comment not found'
      });
    }

    const newResolvedState = resolved !== undefined ? Boolean(resolved) : !targetComment.resolved;
    let updated = null;

    if (isDbAvailable) {
      try {
        updated = await withDbTimeout(
          prisma.comment.update({
            where: { id: commentId },
            data: { resolved: newResolvedState },
            include: {
              author: { select: { id: true, name: true, email: true } },
              replies: {
                include: {
                  author: { select: { id: true, name: true, email: true } }
                }
              }
            }
          })
        );
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable || !updated) {
      targetComment.resolved = newResolvedState;
      targetComment.updatedAt = new Date().toISOString();
      memoryComments.set(commentId, targetComment);
      updated = targetComment;
    }

    return res.status(200).json({
      status: 'success',
      message: newResolvedState ? 'Comment resolved' : 'Comment re-opened',
      comment: updated
    });
  } catch (error) {
    console.error('Resolve Comment Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update comment status'
    });
  }
};

/**
 * Delete a comment
 * DELETE /api/documents/:id/comments/:commentId
 */
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.id || req.user?.userId;

    let targetComment = null;

    if (isDbAvailable) {
      try {
        targetComment = await withDbTimeout(
          prisma.comment.findUnique({
            where: { id: commentId },
            include: { document: true }
          })
        );
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable) {
      targetComment = memoryComments.get(commentId) || null;
    }

    if (!targetComment) {
      return res.status(404).json({
        status: 'error',
        message: 'Comment not found'
      });
    }

    const isAuthor = targetComment.authorId === userId;
    const isDocOwner = targetComment.document && targetComment.document.ownerId === userId;

    if (!isAuthor && !isDocOwner) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden. You do not have permission to delete this comment.'
      });
    }

    if (isDbAvailable) {
      try {
        await withDbTimeout(
          prisma.comment.delete({
            where: { id: commentId }
          })
        );
      } catch (dbErr) {
        isDbAvailable = false;
      }
    }

    if (!isDbAvailable) {
      memoryComments.delete(commentId);
      for (const [key, val] of memoryComments.entries()) {
        if (val.parentId === commentId) {
          memoryComments.delete(key);
        }
      }
    }

    return res.status(200).json({
      status: 'success',
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete Comment Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete comment'
    });
  }
};

module.exports = {
  createComment,
  getComments,
  resolveComment,
  deleteComment,
  memoryComments
};
