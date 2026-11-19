export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  starred?: boolean;
  parents?: string[];
}

export interface DriveAboutInfo {
  user?: {
    displayName?: string;
    emailAddress?: string;
    photoLink?: string;
  };
  storageQuota?: {
    limit?: string;
    usage?: string;
    usageInDrive?: string;
  };
}

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const FOLDER_MIME = 'application/vnd.google-apps.folder';

async function parseDriveError(res: Response, fallback: string): Promise<string> {
  try {
    const err = await res.json();
    return err?.error?.message || fallback;
  } catch {
    return fallback;
  }
}

export async function getDriveAbout(accessToken: string): Promise<DriveAboutInfo> {
  const res = await fetch(`${DRIVE_API_BASE}/about?fields=user,storageQuota`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(await parseDriveError(res, 'Failed to read Google Drive account details.'));
  }
  return res.json();
}

export async function listDriveFiles(
  accessToken: string,
  options?: { queryText?: string; folderId?: string; pageSize?: number }
): Promise<DriveFileItem[]> {
  const filters: string[] = ['trashed = false'];
  if (options?.folderId) {
    filters.push(`'${options.folderId.replace(/'/g, "\\'")}' in parents`);
  }
  if (options?.queryText?.trim()) {
    const escaped = options.queryText.trim().replace(/'/g, "\\'");
    filters.push(`name contains '${escaped}'`);
  }

  const params = new URLSearchParams({
    q: filters.join(' and '),
    pageSize: String(options?.pageSize || 25),
    orderBy: 'modifiedTime desc',
    fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,starred,parents)',
  });

  const res = await fetch(`${DRIVE_API_BASE}/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(await parseDriveError(res, 'Failed to list Google Drive files.'));
  }
  const data = await res.json();
  return Array.isArray(data.files) ? data.files : [];
}

export async function ensureTalentRadarFolder(
  accessToken: string,
  folderName = 'TalentRadar.OS Exports'
): Promise<DriveFileItem> {
  const escaped = folderName.replace(/'/g, "\\'");
  const q = `name = '${escaped}' and mimeType = '${FOLDER_MIME}' and trashed = false`;
  const searchParams = new URLSearchParams({
    q,
    pageSize: '1',
    fields: 'files(id,name,mimeType,webViewLink)',
  });
  const searchRes = await fetch(`${DRIVE_API_BASE}/files?${searchParams.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (searchRes.ok) {
    const data = await searchRes.json();
    if (Array.isArray(data.files) && data.files.length > 0) {
      return data.files[0];
    }
  }

  const createRes = await fetch(`${DRIVE_API_BASE}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: FOLDER_MIME,
    }),
  });
  if (!createRes.ok) {
    throw new Error(await parseDriveError(createRes, 'Failed to create TalentRadar folder in Google Drive.'));
  }
  return createRes.json();
}

export async function uploadFileToDrive(
  accessToken: string,
  params: { name: string; content: string | Blob; mimeType: string; folderId?: string }
): Promise<DriveFileItem> {
  const metadata: Record<string, any> = {
    name: params.name,
    mimeType: params.mimeType,
  };
  if (params.folderId) {
    metadata.parents = [params.folderId];
  }

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  const contentBlob =
    params.content instanceof Blob
      ? params.content
      : new Blob([params.content], { type: params.mimeType });
  form.append('file', contentBlob);

  const res = await fetch(
    `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    }
  );
  if (!res.ok) {
    throw new Error(await parseDriveError(res, 'Failed to upload file to Google Drive.'));
  }
  return res.json();
}

export async function readDriveFileContent(
  accessToken: string,
  file: DriveFileItem
): Promise<string> {
  const isGoogleDoc = file.mimeType === 'application/vnd.google-apps.document';
  const isGoogleSheet = file.mimeType === 'application/vnd.google-apps.spreadsheet';
  const isGoogleSlide = file.mimeType === 'application/vnd.google-apps.presentation';

  let url = `${DRIVE_API_BASE}/files/${encodeURIComponent(file.id)}?alt=media`;
  if (isGoogleDoc || isGoogleSlide) {
    url = `${DRIVE_API_BASE}/files/${encodeURIComponent(file.id)}/export?mimeType=text/plain`;
  } else if (isGoogleSheet) {
    url = `${DRIVE_API_BASE}/files/${encodeURIComponent(file.id)}/export?mimeType=text/csv`;
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(await parseDriveError(res, 'Unable to read Google Drive file content.'));
  }
  return res.text();
}

export async function renameDriveFile(
  accessToken: string,
  fileId: string,
  newName: string
): Promise<DriveFileItem> {
  const res = await fetch(
    `${DRIVE_API_BASE}/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size,modifiedTime,webViewLink`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newName }),
    }
  );
  if (!res.ok) {
    throw new Error(await parseDriveError(res, 'Failed to rename file in Google Drive.'));
  }
  return res.json();
}

export async function updateDriveFileContent(
  accessToken: string,
  fileId: string,
  content: string,
  mimeType = 'text/plain'
): Promise<DriveFileItem> {
  const res = await fetch(
    `${DRIVE_UPLOAD_BASE}/files/${encodeURIComponent(fileId)}?uploadType=media&fields=id,name,mimeType,size,modifiedTime,webViewLink`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': mimeType,
      },
      body: content,
    }
  );
  if (!res.ok) {
    throw new Error(await parseDriveError(res, 'Failed to update file content in Google Drive.'));
  }
  return res.json();
}

export async function deleteDriveFile(accessToken: string, fileId: string): Promise<void> {
  const res = await fetch(`${DRIVE_API_BASE}/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(await parseDriveError(res, 'Failed to delete file from Google Drive.'));
  }
}

export function formatDriveBytes(sizeStr?: string): string {
  const bytes = Number(sizeStr);
  if (!bytes || Number.isNaN(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
