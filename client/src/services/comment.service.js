import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('collabspace_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

/**
 * Fetch all comments for a document
 */
export const getComments = async (documentId) => {
  const response = await fetch(`${API_URL}/documents/${documentId}/comments`, {
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch comments');
  return data.comments || [];
};

/**
 * Create a new comment or reply
 */
export const createComment = async (documentId, commentData) => {
  const response = await fetch(`${API_URL}/documents/${documentId}/comments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(commentData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create comment');
  return data.comment;
};

/**
 * Toggle resolve status for a comment thread
 */
export const resolveComment = async (documentId, commentId, resolved) => {
  const response = await fetch(`${API_URL}/documents/${documentId}/comments/${commentId}/resolve`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ resolved })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update comment');
  return data.comment;
};

/**
 * Delete a comment
 */
export const deleteComment = async (documentId, commentId) => {
  const response = await fetch(`${API_URL}/documents/${documentId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to delete comment');
  return data;
};
