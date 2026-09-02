const API_URL = 'http://localhost:5000/api/documents';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('collabspace_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

/**
 * Fetch all documents owned by user
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
 * Get document details by ID
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

