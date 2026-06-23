import axios from 'axios';

// Axios instance — uses Vite proxy to forward /api → Spring Boot:8080
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://ciphershare-backend.onrender.com/api',
  withCredentials: true,          // Send session cookies
  headers: { 'Content-Type': 'application/json' },
});

// ────── Auth ──────────────────────────────────────────────
export const loginUser    = (idToken) =>
  api.post('/auth/login', `idToken=${encodeURIComponent(idToken)}`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
export const registerUser = (idToken, name, role) =>
  api.post('/auth/register', new URLSearchParams({ idToken, name, role }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
export const logoutUser   = () => api.get('/auth/logout');
export const getMe        = () => api.get('/auth/me');

// ────── Admin ─────────────────────────────────────────────
export const getAdminDashboard = () => api.get('/admin/dashboard');
export const getAdminUsers     = () => api.get('/admin/users');
export const getAdminFiles     = () => api.get('/admin/files');
export const getAdminLogs      = () => api.get('/admin/logs');
export const updateUserRole    = (uid, role) =>
  api.post('/admin/update-role', new URLSearchParams({ uid, role }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
export const getPendingUsers   = () => api.get('/admin/pending-users');
export const approveUser       = (uid, role) =>
  api.post('/admin/approve-user', new URLSearchParams({ uid, role }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
export const deactivateUser    = (uid) =>
  api.post('/admin/deactivate-user', new URLSearchParams({ uid }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
export const inviteUser        = (name, email, role, department) =>
  api.post('/admin/invite-user', new URLSearchParams({ name, email, role, department }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

// ────── Manager ───────────────────────────────────────────
export const getManagerDashboard = () => api.get('/manager/dashboard');
export const getManagerMyFiles   = () => api.get('/manager/my-files');
export const getManagerShareData = () => api.get('/manager/share-data');
export const getManagerSharedOut = () => api.get('/manager/shared-out');
export const getManagerActivity  = () => api.get('/manager/activity');
export const getManagerUsers     = () => api.get('/manager/users');

/**
 * Update the canDownload flag on an existing share permission.
 * @param {string} permissionId  – Firestore document ID of the permission
 * @param {boolean} canDownload  – new value for canDownload
 */
export const updateSharePermission = (permissionId, canDownload) =>
  api.put('/manager/share/update', null, {
    params: { permissionId, canDownload },
  });

/**
 * Revoke (delete) a share permission by its Firestore document ID.
 * @param {string} permissionId
 */
export const revokeShareAccess = (permissionId) =>
  api.delete('/manager/share/revoke', { params: { permissionId } });

// ────── User ──────────────────────────────────────────────
export const getUserDashboard    = () => api.get('/user/dashboard');
export const getUserSharedFiles  = () => api.get('/user/shared-files');
export const getUserProfile      = () => api.get('/user/profile');
export const getUserActivity     = () => api.get('/user/activity');
export const getUserNotifications = () => api.get('/user/notifications');
export const getUserDownloads    = () => api.get('/user/downloads');
export const recordDownload      = (fileId) =>
  api.post('/user/record-download', new URLSearchParams({ fileId }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
export const markNotificationRead = (notifId) =>
  api.post('/user/notifications/read', new URLSearchParams({ notifId }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
export const markAllNotificationsRead = () => api.post('/user/notifications/read-all');
export const updateUserProfile   = (name, department, phoneNumber, bio, profilePictureUrl, coverPhotoUrl) => {
  const params = { name, department };
  if (phoneNumber !== undefined) params.phoneNumber = phoneNumber;
  if (bio !== undefined) params.bio = bio;
  if (profilePictureUrl !== undefined) params.profilePictureUrl = profilePictureUrl;
  if (coverPhotoUrl !== undefined) params.coverPhotoUrl = coverPhotoUrl;
  return api.post('/user/update-profile', new URLSearchParams(params),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
};

export const uploadAvatar = (formData) =>
  api.post('/user/upload-avatar', formData,
    { headers: { 'Content-Type': 'multipart/form-data' } });

export const uploadCover = (formData) =>
  api.post('/user/upload-cover', formData,
    { headers: { 'Content-Type': 'multipart/form-data' } });

// ────── Files ─────────────────────────────────────────────
export const uploadFile = (formData) =>
  api.post('/file/upload', formData,
    { headers: { 'Content-Type': 'multipart/form-data' } });

export const deleteFile = (fileId) =>
  api.post('/file/delete', new URLSearchParams({ fileId }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

export const shareFile = (data) =>
  api.post('/file/share', new URLSearchParams(data),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

export const getFileActivity = () => api.get('/file/activity');

/**
 * Returns the download URL for a file.
 * - If the file has a Firebase Storage URL it will be returned from the server.
 * - Otherwise the Spring Boot /api/file/download endpoint streams from disk.
 */
export const downloadFileUrl = (fileId) => `/api/file/download?fileId=${fileId}`;

export const getFileMetadata = (fileId) => api.get('/file/metadata', { params: { fileId } });

export const logProtectionEvent = (fileId, eventType) =>
  api.post('/file/log-event', new URLSearchParams({ fileId, eventType }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

export default api;
