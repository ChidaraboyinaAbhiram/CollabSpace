const API_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('collabspace_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

/**
 * Fetch all versions for a document
 */
export const getVersions = async (documentId) => {
  const response = await fetch(`${API_URL}/documents/${documentId}/versions`, {
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch version history');
  return data.versions || [];
};

/**
 * Fetch details for a specific version snapshot
 */
export const getVersionById = async (documentId, versionId) => {
  const response = await fetch(`${API_URL}/documents/${documentId}/versions/${versionId}`, {
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch version snapshot');
  return data.version;
};

/**
 * Create a new named version snapshot
 */
export const createVersion = async (documentId, versionName) => {
  const response = await fetch(`${API_URL}/documents/${documentId}/versions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ versionName })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to capture version snapshot');
  return data.version;
};

/**
 * Restore document to a historical version
 */
export const restoreVersion = async (documentId, versionId) => {
  const response = await fetch(`${API_URL}/documents/${documentId}/versions/${versionId}/restore`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to restore version');
  return data;
};
