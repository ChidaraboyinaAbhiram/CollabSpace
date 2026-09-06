/**
 * CollabSpace Centralized Client API Configuration
 * Supports production environment variables (Vercel, Render) with local fallback
 */

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');

const RAW_SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (
  import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') 
    : 'http://localhost:5000'
);
export const SOCKET_URL = RAW_SOCKET_URL.replace(/\/+$/, '');

export const API_ENDPOINTS = {
  AUTH: API_BASE_URL + '/auth',
  DOCUMENTS: API_BASE_URL + '/documents',
  CACHE: API_BASE_URL + '/cache'
};
