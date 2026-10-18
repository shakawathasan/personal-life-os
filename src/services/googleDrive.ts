import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import defaultFirebaseConfig from '../../firebase-applet-config.json';
import { StorageService } from './storage.ts';
import { Page } from '../types.ts';

// Get effective Firebase config
function getActiveFirebaseConfig() {
  const custom = StorageService.getCustomFirebaseConfig();
  if (custom && custom.apiKey) return custom;
  return defaultFirebaseConfig;
}

// Initialize Firebase App singleton with safe fallback
let app: any = null;
let auth: any = null;
try {
  const cfg = getActiveFirebaseConfig();
  app = getApps().length === 0 ? initializeApp(cfg) : getApp();
  auth = getAuth(app);
} catch (err) {
  console.warn('Firebase init deferred or offline:', err);
}
export { auth };

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = StorageService.getGoogleAccessToken();

// Initialize auth state listener with local persistence
export const initAuth = (
  onAuthSuccess?: (user: any, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Check if we already have a saved session in localStorage
  const storedToken = StorageService.getGoogleAccessToken();
  const storedUser = StorageService.getGoogleUser();
  if (storedToken && storedUser) {
    cachedAccessToken = storedToken;
    if (onAuthSuccess) onAuthSuccess(storedUser, storedToken);
  }

  if (!auth) {
    if (!storedToken && onAuthFailure) onAuthFailure();
    return () => {};
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = cachedAccessToken || StorageService.getGoogleAccessToken();
      if (token) {
        if (onAuthSuccess) onAuthSuccess(user, token);
      }
    } else if (!StorageService.getGoogleAccessToken() && !isSigningIn) {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Direct Google Identity Services (GIS) Sign-In
export const gisSignIn = (clientId: string): Promise<{ user: any; accessToken: string }> => {
  return new Promise((resolve, reject) => {
    const googleObj = (window as any).google;
    if (!googleObj || !googleObj.accounts?.oauth2) {
      return reject(
        new Error('Google Identity Services library is still loading. Please check your internet connection and try again.')
      );
    }

    try {
      const tokenClient = googleObj.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            return reject(new Error(tokenResponse.error_description || tokenResponse.error));
          }
          const token = tokenResponse.access_token;
          cachedAccessToken = token;
          StorageService.saveGoogleAccessToken(token);

          // Fetch user profile from Google userinfo API
          try {
            const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${token}` },
            });
            const profile = await profileRes.json();
            const userObj = {
              displayName: profile.name || profile.email,
              email: profile.email,
              photoURL: profile.picture,
              uid: profile.sub,
            };
            StorageService.saveGoogleUser(userObj);
            resolve({ user: userObj, accessToken: token });
          } catch {
            const fallbackUser = { displayName: 'Google User', email: '', uid: 'gis-user' };
            StorageService.saveGoogleUser(fallbackUser);
            resolve({ user: fallbackUser, accessToken: token });
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      reject(err);
    }
  });
};

// Google Sign-in flow supporting both Firebase and GIS
export const googleSignIn = async (customClientId?: string): Promise<{ user: any; accessToken: string } | null> => {
  const clientId =
    customClientId ||
    StorageService.getGoogleClientId() ||
    (getActiveFirebaseConfig() as any).oAuthClientId;

  // If user provided a specific Google Client ID, use Google Identity Services
  if (customClientId || StorageService.getGoogleClientId()) {
    return await gisSignIn(clientId);
  }

  if (!auth) {
    if (clientId) {
      return await gisSignIn(clientId);
    }
    throw new Error('Google Authentication is not configured. Please enter your Google Client ID in Settings.');
  }

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve access token from Google sign-in.');
    }

    cachedAccessToken = credential.accessToken;
    StorageService.saveGoogleAccessToken(cachedAccessToken);
    const u = {
      displayName: result.user.displayName,
      email: result.user.email,
      photoURL: result.user.photoURL,
      uid: result.user.uid,
    };
    StorageService.saveGoogleUser(u);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    if (error.code === 'auth/unauthorized-domain') {
      const currentHost = window.location.hostname;
      // Try GIS fallback if clientId is available
      if (clientId && (window as any).google?.accounts?.oauth2) {
        try {
          return await gisSignIn(clientId);
        } catch (gisErr) {
          console.error('GIS fallback error:', gisErr);
        }
      }
      throw new Error(
        `Domain "${currentHost}" is not authorized for this Firebase project. To fix: add "${currentHost}" in Firebase Console > Authentication > Settings > Authorized domains, OR enter your own Google Client ID in Settings.`
      );
    }
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
    }
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed before completing authentication.');
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  const stored = StorageService.getGoogleAccessToken();
  if (stored) {
    cachedAccessToken = stored;
    return stored;
  }
  return null;
};

export const logout = async () => {
  if (auth) {
    try {
      await signOut(auth);
    } catch {}
  }
  cachedAccessToken = null;
  StorageService.saveGoogleAccessToken(null);
  StorageService.saveGoogleUser(null);
};

// Google Drive API Helpers
const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_URL = 'https://www.googleapis.com/upload/drive/v3/files';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
}

// Search or create the "Personal Life OS" workspace folder in Google Drive
export const findOrCreateAppFolder = async (accessToken: string): Promise<string> => {
  const query = encodeURIComponent("name = 'Personal Life OS' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
  const res = await fetch(`${DRIVE_API_URL}/files?q=${query}&fields=files(id, name)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to query Google Drive folder: ${res.statusText}`);
  }
  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  // Create folder
  const createRes = await fetch(`${DRIVE_API_URL}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Personal Life OS',
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });
  if (!createRes.ok) {
    throw new Error(`Failed to create Google Drive folder: ${createRes.statusText}`);
  }
  const newFolder = await createRes.json();
  return newFolder.id;
};

// List files in Personal Life OS folder
export const listDriveFiles = async (accessToken: string): Promise<DriveFileItem[]> => {
  try {
    const folderId = await findOrCreateAppFolder(accessToken);
    const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const res = await fetch(`${DRIVE_API_URL}/files?q=${query}&fields=files(id, name, mimeType, modifiedTime, size)&pageSize=50`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new Error(`Drive list error: ${res.statusText}`);
    }
    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error('List Drive files failed:', err);
    throw err;
  }
};

// Upload or Update a Note in Google Drive as Markdown file
export const syncNoteToDrive = async (accessToken: string, page: Page): Promise<{ fileId: string; modifiedTime: string }> => {
  const folderId = await findOrCreateAppFolder(accessToken);
  const fileName = `${page.title ? page.title.replace(/[/\\?%*:|"<>]/g, '-') : 'Untitled'}.md`;
  
  const markdownBody = `---
title: "${page.title}"
type: "${page.type}"
updatedAt: "${page.updatedAt}"
tags: [${page.tags.map(t => `"${t}"`).join(', ')}]
---

# ${page.title}

${page.content}
${page.cornellSummary ? `\n\n## Summary\n${page.cornellSummary}` : ''}
${page.cornellCues && page.cornellCues.length ? `\n\n## Cues / Questions\n${page.cornellCues.map(c => `- ${c}`).join('\n')}` : ''}
`;

  const metadata = {
    name: fileName,
    mimeType: 'text/markdown',
    parents: page.driveFileId ? undefined : [folderId],
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/markdown\r\n\r\n' +
    markdownBody +
    closeDelimiter;

  const url = page.driveFileId
    ? `${UPLOAD_API_URL}/${page.driveFileId}?uploadType=multipart`
    : `${UPLOAD_API_URL}?uploadType=multipart`;

  const method = page.driveFileId ? 'PATCH' : 'POST';

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const errorMsg = await res.text();
    throw new Error(`Drive sync note failed: ${errorMsg}`);
  }

  const result = await res.json();
  return { fileId: result.id, modifiedTime: result.modifiedTime || new Date().toISOString() };
};

// Upload Full JSON Backup to Google Drive
export const uploadBackupToDrive = async (accessToken: string, backupJson: string): Promise<string> => {
  const folderId = await findOrCreateAppFolder(accessToken);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `Personal-Life-OS-Backup-${timestamp}.json`;

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    parents: [folderId],
  };

  const boundary = '-------backupboundary123';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    backupJson +
    closeDelimiter;

  const res = await fetch(`${UPLOAD_API_URL}?uploadType=multipart`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    throw new Error(`Failed to upload backup to Drive: ${res.statusText}`);
  }

  const data = await res.json();
  return data.id;
};

// Download file content from Google Drive
export const downloadDriveFile = async (accessToken: string, fileId: string): Promise<string> => {
  const res = await fetch(`${DRIVE_API_URL}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to download Drive file: ${res.statusText}`);
  }
  return await res.text();
};

// Delete file from Google Drive
export const deleteDriveFile = async (accessToken: string, fileId: string): Promise<void> => {
  const res = await fetch(`${DRIVE_API_URL}/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to delete Drive file: ${res.statusText}`);
  }
};
