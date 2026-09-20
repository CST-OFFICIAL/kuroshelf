import { ShelfEntry } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

export interface DriveBackupFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
}

export interface DriveBackupPayload {
  version: string;
  exportedAt: string;
  platform: string;
  totalItems: number;
  items: ShelfEntry[];
  customization?: Record<string, any>;
}

const STORAGE_KEY_TOKEN = 'kuro_gdrive_access_token';
const STORAGE_KEY_EXPIRES = 'kuro_gdrive_token_expires_at';
const DRIVE_SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly';

/**
 * Returns the current stored Google Drive OAuth access token if not expired.
 */
export function getStoredDriveToken(): string | null {
  try {
    const token = sessionStorage.getItem(STORAGE_KEY_TOKEN);
    const expiresAt = sessionStorage.getItem(STORAGE_KEY_EXPIRES);
    if (!token || !expiresAt) return null;
    if (Date.now() > parseInt(expiresAt, 10)) {
      disconnectGoogleDrive();
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

/**
 * Checks if Google Drive is currently authorized.
 */
export function isGoogleDriveConnected(): boolean {
  return Boolean(getStoredDriveToken());
}

/**
 * Disconnects Google Drive by clearing the session token and revoking if available.
 */
export function disconnectGoogleDrive(): void {
  try {
    const token = sessionStorage.getItem(STORAGE_KEY_TOKEN);
    if (token && typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2?.revoke) {
      (window as any).google.accounts.oauth2.revoke(token, () => {});
    }
    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
    sessionStorage.removeItem(STORAGE_KEY_EXPIRES);
  } catch {
    // Ignore cleanup error
  }
}

/**
 * Requests an access token from Google Identity Services.
 * Must be triggered by a user action (click).
 */
export function requestGoogleDriveAuth(): Promise<string> {
  return new Promise((resolve, reject) => {
    const clientId = (firebaseConfig as any).oAuthClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      reject(
        new Error(
          'Google Client ID is missing. Please verify your Google Cloud integration settings.'
        )
      );
      return;
    }

    if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
      reject(
        new Error(
          'Google Identity Services SDK is not loaded. Please check your internet connection and try again.'
        )
      );
      return;
    }

    try {
      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: DRIVE_SCOPES,
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error || 'Google authentication failed.'));
            return;
          }

          if (!response.access_token) {
            reject(new Error('No access token received from Google.'));
            return;
          }

          const expiresIn = response.expires_in ? parseInt(response.expires_in, 10) * 1000 : 3600 * 1000;
          const expiresAt = Date.now() + expiresIn - 60000; // 1 min buffer

          sessionStorage.setItem(STORAGE_KEY_TOKEN, response.access_token);
          sessionStorage.setItem(STORAGE_KEY_EXPIRES, expiresAt.toString());

          resolve(response.access_token);
        },
        error_callback: (err: any) => {
          reject(new Error(err?.message || 'OAuth token request canceled or blocked.'));
        },
      });

      tokenClient.requestAccessToken({ prompt: '' });
    } catch (err: any) {
      reject(new Error(err?.message || 'Failed to initialize Google OAuth dialog.'));
    }
  });
}

/**
 * Ensures an active access token is available, prompting if necessary.
 */
async function getOrRequestAccessToken(): Promise<string> {
  const existingToken = getStoredDriveToken();
  if (existingToken) return existingToken;
  return await requestGoogleDriveAuth();
}

/**
 * Uploads a Kuro Shelf backup to the user's Google Drive.
 */
export async function uploadBackupToDrive(
  shelf: ShelfEntry[],
  customization?: Record<string, any>,
  customName?: string
): Promise<DriveBackupFile> {
  const token = await getOrRequestAccessToken();

  const timestamp = new Date().toISOString().slice(0, 10);
  const fileName = customName || `kuro-shelf-backup-${timestamp}.json`;

  const payload: DriveBackupPayload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    platform: 'Kuro Shelf',
    totalItems: shelf.length,
    items: shelf,
    customization,
  };

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: `Kuro Shelf backup containing ${shelf.length} anime and manga titles.`,
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(payload, null, 2) +
    closeDelimiter;

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!response.ok) {
    if (response.status === 401) {
      disconnectGoogleDrive();
      throw new Error('Google Drive authorization expired. Please reconnect and try again.');
    }
    const errText = await response.text();
    throw new Error(`Google Drive upload failed (${response.status}): ${errText}`);
  }

  const result = await response.json();
  return result as DriveBackupFile;
}

/**
 * Lists existing Kuro Shelf backups from the user's Google Drive.
 */
export async function listDriveBackups(): Promise<DriveBackupFile[]> {
  const token = await getOrRequestAccessToken();

  const query = encodeURIComponent("name contains 'kuro-shelf-backup' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,modifiedTime,size,webViewLink)&orderBy=modifiedTime desc&pageSize=20`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      disconnectGoogleDrive();
      throw new Error('Google Drive authorization expired. Please reconnect and try again.');
    }
    const errText = await response.text();
    throw new Error(`Failed to list backups from Google Drive: ${errText}`);
  }

  const data = await response.json();
  return (data.files || []) as DriveBackupFile[];
}

/**
 * Downloads and parses a backup file from Google Drive by its file ID.
 */
export async function downloadBackupFromDrive(fileId: string): Promise<DriveBackupPayload> {
  const token = await getOrRequestAccessToken();

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      disconnectGoogleDrive();
      throw new Error('Google Drive authorization expired. Please reconnect and try again.');
    }
    const errText = await response.text();
    throw new Error(`Failed to download backup: ${errText}`);
  }

  const json = await response.json();
  if (!json || (!Array.isArray(json.items) && !Array.isArray(json))) {
    throw new Error('Downloaded file is not a valid Kuro Shelf backup format.');
  }

  return {
    version: json.version || '1.0',
    exportedAt: json.exportedAt || new Date().toISOString(),
    platform: json.platform || 'Kuro Shelf',
    totalItems: Array.isArray(json.items) ? json.items.length : json.length,
    items: Array.isArray(json.items) ? json.items : json,
    customization: json.customization,
  };
}

/**
 * Deletes a backup file from Google Drive.
 */
export async function deleteBackupFromDrive(fileId: string): Promise<void> {
  const token = await getOrRequestAccessToken();

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    if (response.status === 401) {
      disconnectGoogleDrive();
      throw new Error('Google Drive authorization expired. Please reconnect and try again.');
    }
    const errText = await response.text();
    throw new Error(`Failed to delete backup from Google Drive: ${errText}`);
  }
}
