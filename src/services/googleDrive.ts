import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Page } from '../types.ts';

// Initialize Firebase App singleton with safe fallback
let app: any = null;
let auth: any = null;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
} catch (err) {
  console.warn('Firebase init deferred or offline:', err);
}
export { auth };

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (!auth) {
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Google Sign-in flow
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (!auth) {
    throw new Error('Google Auth is not initialized in this environment.');
  }
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google sign-in.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
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
  
  // Format note with metadata header and content
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

// Delete file from Google Drive (MUST be accompanied by user confirmation UI in the caller!)
export const deleteDriveFile = async (accessToken: string, fileId: string): Promise<void> => {
  const res = await fetch(`${DRIVE_API_URL}/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to delete Drive file: ${res.statusText}`);
  }
};
