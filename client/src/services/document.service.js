import { API_ENDPOINTS } from '../config/api';

const API_URL = API_ENDPOINTS.DOCUMENTS;

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('collabspace_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

/**
 * Fetch all documents owned or shared with user
 */
export const fetchDocuments = async () => {
  const response = await fetch(API_URL, {
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch documents');
  }
  return data.documents || [];
};

/**
 * Create a new document
 */
export const createDocument = async (title, icon) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ title, icon })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create document');
  }
  return data.document;
};

/**
 * Get document details by ID (including owner, collaborators, versions)
 */
export const getDocumentById = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve document');
  }
  return data.document;
};

/**
 * Update document title, icon, and/or content
 */
export const updateDocument = async (id, updates) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to save document changes');
  }
  return data.document;
};

/**
 * Delete a document by ID
 */
export const deleteDocument = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete document');
  }
  return data;
};

/**
 * Share a document with a collaborator by email
 */
export const shareDocument = async (id, email, role = 'EDITOR') => {
  const response = await fetch(`${API_URL}/${id}/share`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ email, role })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to share document');
  }
  return data.collaborator;
};

/**
 * Update a collaborator's role
 */
export const updateCollaboratorRole = async (id, userId, role) => {
  const response = await fetch(`${API_URL}/${id}/collaborators/${userId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ role })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update collaborator role');
  }
  return data.collaborator;
};

/**
 * Remove a collaborator from document
 */
export const removeCollaborator = async (id, userId) => {
  const response = await fetch(`${API_URL}/${id}/collaborators/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to remove collaborator');
  }
  return data;
};
