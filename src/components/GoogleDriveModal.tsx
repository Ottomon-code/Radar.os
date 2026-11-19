import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  HardDrive,
  X,
  Search,
  RefreshCw,
  Upload,
  FileText,
  Folder,
  Trash2,
  Edit3,
  Eye,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Download,
  FileSpreadsheet,
  Save,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSavedItems } from '../context/SavedItemsContext';
import { useCurrency } from '../context/CurrencyContext';
import {
  DriveAboutInfo,
  DriveFileItem,
  getDriveAbout,
  listDriveFiles,
  ensureTalentRadarFolder,
  uploadFileToDrive,
  readDriveFileContent,
  renameDriveFile,
  updateDriveFileContent,
  deleteDriveFile,
  formatDriveBytes,
} from '../utils/googleDriveService';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PendingMutation =
  | {
      type: 'upload';
      title: string;
      description: string;
      fileName: string;
      mimeType: string;
      content: string | Blob;
    }
  | {
      type: 'rename';
      title: string;
      description: string;
      fileId: string;
      newName: string;
    }
  | {
      type: 'update_content';
      title: string;
      description: string;
      fileId: string;
      fileName: string;
      content: string;
    }
  | {
      type: 'delete';
      title: string;
      description: string;
      fileId: string;
      fileName: string;
    };

export default function GoogleDriveModal({ isOpen, onClose }: GoogleDriveModalProps) {
  const { user, preferences, savedCareerPaths, driveAccessToken, connectGoogleDrive } = useAuth();
  const { savedJobs, savedCareerPaths: bookmarkedCareerPaths, savedNews } = useSavedItems();
  const { currency, isPppMode } = useCurrency();

  const [about, setAbout] = useState<DriveAboutInfo | null>(null);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [folderOnly, setFolderOnly] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<DriveFileItem | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Mandatory explicit confirmation state before any write/delete call
  const [pendingMutation, setPendingMutation] = useState<PendingMutation | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadDriveWorkspace = useCallback(
    async (token: string, queryText = searchQuery, onlyAppFolder = folderOnly) => {
      setIsLoadingFiles(true);
      setErrorMsg(null);
      try {
        const [aboutData, folder] = await Promise.all([
          getDriveAbout(token).catch(() => null),
          onlyAppFolder ? ensureTalentRadarFolder(token) : Promise.resolve(null),
        ]);
        if (aboutData) setAbout(aboutData);
        if (folder) setActiveFolderId(folder.id);

        const list = await listDriveFiles(token, {
          queryText,
          folderId: onlyAppFolder && folder ? folder.id : undefined,
          pageSize: 30,
        });
        setFiles(list);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Unable to load Google Drive files. Re-connect Google Drive if your token expired.');
      } finally {
        setIsLoadingFiles(false);
      }
    },
    [folderOnly, searchQuery]
  );

  useEffect(() => {
    if (isOpen && driveAccessToken) {
      loadDriveWorkspace(driveAccessToken);
    }
  }, [isOpen, driveAccessToken, loadDriveWorkspace]);

  if (!isOpen) return null;

  const handleGoogleConnect = async () => {
    setIsConnecting(true);
    setErrorMsg(null);
    try {
      const token = await connectGoogleDrive();
      if (token) {
        setStatusMsg('Google Drive connected cleanly.');
        await loadDriveWorkspace(token);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to connect Google Drive.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePreviewFile = async (file: DriveFileItem) => {
    if (!driveAccessToken) return;
    setSelectedFile(file);
    setRenameDraft(file.name);
    setIsEditingContent(false);
    setPreviewContent('');
    if (file.mimeType === 'application/vnd.google-apps.folder') return;

    setIsLoadingPreview(true);
    try {
      const text = await readDriveFileContent(driveAccessToken, file);
      setPreviewContent(text.slice(0, 12000));
      setEditedContent(text);
    } catch (err: any) {
      setPreviewContent(`Preview unavailable for this file type (${file.mimeType}). Use "Open in Drive" to view.\n\n${err?.message || ''}`);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const queueExportSavedJobsCsv = () => {
    const header = ['ID', 'Role Title', 'Company', 'Location', 'Salary Range', 'Sector'];
    const rows = savedJobs.map((j) =>
      [j.id, j.title, j.company, j.location, j.salaryRange, j.sector]
        .map((v) => `"${String(v || '').replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [header.join(','), ...(rows.length > 0 ? rows : ['"SAMPLE","AI Infrastructure Architect","Frontier Lab","Remote","$320,000 - $480,000","Frontier AI"'])].join('\n');
    const fileName = `TalentRadar_Saved_Roles_${new Date().toISOString().split('T')[0]}.csv`;

    setPendingMutation({
      type: 'upload',
      title: 'Save CSV Export to Google Drive?',
      description: `Upload "${fileName}" (${savedJobs.length} bookmarked roles) into your "TalentRadar.OS Exports" folder on Google Drive?`,
      fileName,
      mimeType: 'text/csv',
      content: csv,
    });
  };

  const queueExportCareerDossierMarkdown = () => {
    const targetRole = preferences?.targetRole || 'Principal AI Infrastructure Architect';
    const targetSalary = preferences?.targetSalary || 310000;
    const lines = [
      `# TalentRadar.OS Executive Career & Comp Snapshot`,
      `Generated: ${new Date().toISOString()}`,
      `Operator: ${user?.email || 'Authenticated User'}`,
      `Currency Display: ${currency}${isPppMode ? ' (PPP Enabled)' : ''}`,
      ``,
      `## Target Role & Compensation`,
      `- Target Role: ${targetRole}`,
      `- Target Total Compensation: $${targetSalary.toLocaleString()} USD`,
      `- Target Sector: ${preferences?.targetSector || 'Frontier AI & High-Performance Compute'}`,
      ``,
      `## Saved Career Trajectories (${bookmarkedCareerPaths.length + savedCareerPaths.length})`,
      ...bookmarkedCareerPaths.map((p) => `- ${p.targetRole} ($${p.targetSalary.toLocaleString()} USD • Readiness ${p.readinessScore}%)`),
      ...savedCareerPaths.map((cp) => `- ${cp.roleTitle}: $${cp.targetSalary.toLocaleString()} USD`),
      ``,
      `## Bookmarked Market Signals (${savedNews.length})`,
      ...savedNews.slice(0, 10).map((n) => `- ${n.headline} (${n.source || 'Intel Feed'})`),
    ];
    const fileName = `TalentRadar_Career_Dossier_${new Date().toISOString().split('T')[0]}.md`;

    setPendingMutation({
      type: 'upload',
      title: 'Save Career Dossier to Google Drive?',
      description: `Create "${fileName}" in your "TalentRadar.OS Exports" Google Drive folder?`,
      fileName,
      mimeType: 'text/markdown',
      content: lines.join('\n'),
    });
  };

  const handleLocalFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPendingMutation({
      type: 'upload',
      title: 'Upload File to Google Drive?',
      description: `Upload local file "${file.name}" (${formatDriveBytes(String(file.size))}) into "TalentRadar.OS Exports" on your Google Drive?`,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      content: file,
    });
  };

  const executeConfirmedMutation = async () => {
    if (!pendingMutation || !driveAccessToken) return;
    setIsMutating(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      if (pendingMutation.type === 'upload') {
        const folder = await ensureTalentRadarFolder(driveAccessToken);
        setActiveFolderId(folder.id);
        const created = await uploadFileToDrive(driveAccessToken, {
          name: pendingMutation.fileName,
          content: pendingMutation.content,
          mimeType: pendingMutation.mimeType,
          folderId: folder.id,
        });
        setStatusMsg(`Saved "${created.name}" to Google Drive.`);
      } else if (pendingMutation.type === 'rename') {
        const updated = await renameDriveFile(
          driveAccessToken,
          pendingMutation.fileId,
          pendingMutation.newName
        );
        setSelectedFile(updated);
        setStatusMsg(`Renamed file to "${updated.name}".`);
      } else if (pendingMutation.type === 'update_content') {
        await updateDriveFileContent(
          driveAccessToken,
          pendingMutation.fileId,
          pendingMutation.content
        );
        setPreviewContent(pendingMutation.content);
        setIsEditingContent(false);
        setStatusMsg(`Updated contents of "${pendingMutation.fileName}".`);
      } else if (pendingMutation.type === 'delete') {
        await deleteDriveFile(driveAccessToken, pendingMutation.fileId);
        if (selectedFile?.id === pendingMutation.fileId) {
          setSelectedFile(null);
          setPreviewContent('');
        }
        setStatusMsg(`Deleted "${pendingMutation.fileName}" from Google Drive.`);
      }
      setPendingMutation(null);
      await loadDriveWorkspace(driveAccessToken);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Google Drive operation failed.');
      setPendingMutation(null);
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/85 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-drive-modal-title"
    >
      <div className="relative w-full max-w-5xl bg-[#0c131a] border-2 border-[#38bdf8]/50 rounded-2xl shadow-[0_0_50px_rgba(56,189,248,0.2)] overflow-hidden my-auto text-[#dce7f0]">
        <div className="bg-gradient-to-r from-[#4285F4] via-[#34A853] to-[#22d3a5] h-1.5 w-full" />

        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-[#1e2b36] flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/40">
                <HardDrive className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#22d3a5]/15 text-[#22d3a5] border border-[#22d3a5]/40 font-bold uppercase tracking-wider">
                GOOGLE WORKSPACE // DRIVE V3
              </span>
            </div>
            <h2 id="google-drive-modal-title" className="text-xl sm:text-2xl font-bold font-mono text-white">
              GOOGLE DRIVE <span className="text-[#38bdf8]">DOSSIER VAULT</span>
            </h2>
            <p className="text-xs font-mono text-[#7a8b99]">
              Browse, search, upload, and archive Career Dossiers &amp; Saved Job Benchmarks directly in your Google Drive.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-[#111a22] text-[#7a8b99] hover:text-white hover:bg-[#1e2b36] border border-[#1e2b36] transition cursor-pointer"
            aria-label="Close Google Drive modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Mandatory Confirmation Overlay for Mutating/Destructive Actions */}
          {pendingMutation && (
            <div className="p-4 rounded-xl bg-[#191408] border-2 border-[#fbbf24] space-y-3 font-mono">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-[#fbbf24] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-[#fbbf24]">{pendingMutation.title}</h3>
                  <p className="text-xs text-[#dce7f0] mt-1">{pendingMutation.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={() => setPendingMutation(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#111a22] hover:bg-[#1e2b36] border border-[#1e2b36] text-xs text-[#dce7f0] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={executeConfirmedMutation}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    pendingMutation.type === 'delete'
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-[#22d3a5] hover:bg-[#1db890] text-black'
                  }`}
                >
                  {isMutating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{pendingMutation.type === 'delete' ? 'Confirm Delete' : 'Confirm Save'}</span>
                </button>
              </div>
            </div>
          )}

          {!driveAccessToken ? (
            /* Unconnected / Re-auth Google Sign-In Gate */
            <div className="bg-[#111a22] p-8 rounded-xl border border-[#1e2b36] text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#38bdf8]/15 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8]">
                <HardDrive className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-base font-bold font-mono text-white">
                  Connect Google Drive with Permission
                </h3>
                <p className="text-xs font-mono text-[#7a8b99]">
                  Sign in with your Google account to browse your Drive files, inspect resumes or reports, and save TalentRadar exports into your own Drive. Access tokens remain strictly in browser memory.
                </p>
              </div>

              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={handleGoogleConnect}
                  disabled={isConnecting}
                  className="gsi-material-button inline-flex items-center gap-3 px-5 py-2.5 rounded-lg bg-white hover:bg-gray-100 text-[#1f1f1f] font-sans font-semibold text-sm shadow-lg transition cursor-pointer disabled:opacity-60"
                >
                  <div className="gsi-material-button-icon w-5 h-5 shrink-0">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                  </div>
                  <span>{isConnecting ? 'Connecting Google Drive...' : 'Sign in with Google'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Connected Google Drive Workspace */
            <>
              {/* Account & Quick Export Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111a22] p-3.5 rounded-xl border border-[#1e2b36] text-xs font-mono">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#22d3a5]" />
                  <span>
                    Connected: <strong className="text-white">{about?.user?.emailAddress || user?.email || 'Google Drive'}</strong>
                  </span>
                  {about?.storageQuota?.usage && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#0a0f14] border border-[#1e2b36] text-[#7a8b99]">
                      Used: {formatDriveBytes(about.storageQuota.usage)}
                      {about.storageQuota.limit ? ` / ${formatDriveBytes(about.storageQuota.limit)}` : ''}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={queueExportSavedJobsCsv}
                    className="px-3 py-1.5 rounded-lg bg-[#22d3a5]/15 hover:bg-[#22d3a5]/25 border border-[#22d3a5]/50 text-[#22d3a5] font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Save Roles CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={queueExportCareerDossierMarkdown}
                    className="px-3 py-1.5 rounded-lg bg-[#fbbf24]/15 hover:bg-[#fbbf24]/25 border border-[#fbbf24]/50 text-[#fbbf24] font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Save Career Dossier</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-[#38bdf8] hover:bg-[#0ea5e9] text-black font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleLocalFilePicked}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Search & Filter Row */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  loadDriveWorkspace(driveAccessToken, searchQuery, folderOnly);
                }}
                className="flex flex-wrap items-center gap-2 font-mono text-xs"
              >
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-3.5 h-3.5 text-[#7a8b99] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Google Drive files by name..."
                    className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#38bdf8] rounded-lg pl-9 pr-3 py-2 text-white placeholder-[#7a8b99] outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !folderOnly;
                    setFolderOnly(next);
                    loadDriveWorkspace(driveAccessToken, searchQuery, next);
                  }}
                  className={`px-3 py-2 rounded-lg border font-bold cursor-pointer ${
                    folderOnly
                      ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-[#38bdf8]'
                      : 'bg-[#111a22] border-[#1e2b36] text-[#7a8b99] hover:text-white'
                  }`}
                >
                  {folderOnly ? 'Folder: TalentRadar.OS Exports' : 'Scope: All My Drive'}
                </button>
                <button
                  type="submit"
                  disabled={isLoadingFiles}
                  className="px-3.5 py-2 rounded-lg bg-[#111a22] hover:bg-[#1e2b36] border border-[#1e2b36] text-[#dce7f0] font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                  <span>Search / Refresh</span>
                </button>
              </form>

              {statusMsg && (
                <div className="p-2.5 rounded-lg bg-[#22d3a5]/15 border border-[#22d3a5]/40 text-xs font-mono text-[#22d3a5] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{statusMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/40 text-xs font-mono text-red-300 flex items-center justify-between gap-2">
                  <span>{errorMsg}</span>
                  <button
                    type="button"
                    onClick={handleGoogleConnect}
                    className="px-2.5 py-1 rounded bg-white text-black font-bold text-[10px] shrink-0 cursor-pointer"
                  >
                    Re-authorize Drive
                  </button>
                </div>
              )}

              {/* Split File List + Preview/Edit Drawer */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* File List (Left 7 cols) */}
                <div className="lg:col-span-7 bg-[#0e1720] rounded-xl border border-[#1e2b36] overflow-hidden">
                  <div className="px-3.5 py-2.5 bg-[#111a22] border-b border-[#1e2b36] flex items-center justify-between text-[11px] font-mono text-[#7a8b99]">
                    <span>DRIVE FILES ({files.length})</span>
                    {activeFolderId && folderOnly && <span className="text-[#38bdf8]">Filtered by Folder</span>}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#1e2b36]/60">
                    {isLoadingFiles ? (
                      <div className="p-8 text-center text-xs font-mono text-[#7a8b99] flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#38bdf8]" />
                        <span>Loading Google Drive files...</span>
                      </div>
                    ) : files.length === 0 ? (
                      <div className="p-8 text-center text-xs font-mono text-[#7a8b99]">
                        No matching files found. Use &quot;Save Roles CSV&quot;, &quot;Save Career Dossier&quot;, or &quot;Upload File&quot; above.
                      </div>
                    ) : (
                      files.map((f) => {
                        const isFolder = f.mimeType === 'application/vnd.google-apps.folder';
                        const isSelected = selectedFile?.id === f.id;
                        return (
                          <div
                            key={f.id}
                            className={`px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs font-mono transition ${
                              isSelected ? 'bg-[#38bdf8]/10' : 'hover:bg-[#111a22]'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handlePreviewFile(f)}
                              className="flex items-center gap-2.5 text-left min-w-0 flex-1 cursor-pointer"
                            >
                              {isFolder ? (
                                <Folder className="w-4 h-4 text-[#fbbf24] shrink-0" />
                              ) : (
                                <FileText className="w-4 h-4 text-[#38bdf8] shrink-0" />
                              )}
                              <div className="min-w-0">
                                <div className="text-white font-semibold truncate">{f.name}</div>
                                <div className="text-[10px] text-[#7a8b99] truncate">
                                  {formatDriveBytes(f.size)} •{' '}
                                  {f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString() : '—'}
                                </div>
                              </div>
                            </button>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handlePreviewFile(f)}
                                className="p-1.5 rounded hover:bg-[#1e2b36] text-[#38bdf8] cursor-pointer"
                                title="Inspect / Edit"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {f.webViewLink && (
                                <a
                                  href={f.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded hover:bg-[#1e2b36] text-[#22d3a5]"
                                  title="Open in Google Drive"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  setPendingMutation({
                                    type: 'delete',
                                    title: 'Delete File from Google Drive?',
                                    description: `Are you sure you want to permanently delete "${f.name}" from your Google Drive? This action cannot be undone.`,
                                    fileId: f.id,
                                    fileName: f.name,
                                  })
                                }
                                className="p-1.5 rounded hover:bg-red-500/20 text-red-400 cursor-pointer"
                                title="Delete file"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* File Inspector / Editor (Right 5 cols) */}
                <div className="lg:col-span-5 bg-[#111a22] rounded-xl border border-[#1e2b36] p-3.5 flex flex-col justify-between space-y-3 font-mono">
                  {selectedFile ? (
                    <>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-[#7a8b99]">SELECTED FILE</span>
                          <a
                            href={selectedFile.webViewLink || `https://drive.google.com/file/d/${selectedFile.id}/view`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#38bdf8] hover:underline flex items-center gap-1 text-[11px]"
                          >
                            <span>Open in Drive</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        {/* Rename Control (triggers confirmation dialog) */}
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={renameDraft}
                            onChange={(e) => setRenameDraft(e.target.value)}
                            className="flex-1 bg-[#0a0f14] border border-[#1e2b36] focus:border-[#38bdf8] text-xs rounded-lg px-2.5 py-1.5 text-white outline-none"
                          />
                          <button
                            type="button"
                            disabled={!renameDraft.trim() || renameDraft.trim() === selectedFile.name}
                            onClick={() =>
                              setPendingMutation({
                                type: 'rename',
                                title: 'Rename File in Google Drive?',
                                description: `Rename "${selectedFile.name}" to "${renameDraft.trim()}"?`,
                                fileId: selectedFile.id,
                                newName: renameDraft.trim(),
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-[#38bdf8]/20 hover:bg-[#38bdf8]/30 disabled:opacity-40 border border-[#38bdf8]/40 text-[#38bdf8] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Rename</span>
                          </button>
                        </div>

                        {/* Preview / Text Editor */}
                        {selectedFile.mimeType !== 'application/vnd.google-apps.folder' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-[#7a8b99]">
                              <span>CONTENT PREVIEW</span>
                              <div className="flex items-center gap-2">
                                {!selectedFile.mimeType.startsWith('application/vnd.google-apps.') && (
                                  <button
                                    type="button"
                                    onClick={() => setIsEditingContent((v) => !v)}
                                    className="text-[#fbbf24] hover:underline cursor-pointer"
                                  >
                                    {isEditingContent ? 'Cancel Edit' : 'Edit Text'}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const blob = new Blob([previewContent], { type: 'text/plain;charset=utf-8' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = selectedFile.name;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                  }}
                                  className="text-[#22d3a5] hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Download</span>
                                </button>
                              </div>
                            </div>

                            {isLoadingPreview ? (
                              <div className="h-44 flex items-center justify-center text-xs text-[#7a8b99]">
                                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Reading content...
                              </div>
                            ) : isEditingContent ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editedContent}
                                  onChange={(e) => setEditedContent(e.target.value)}
                                  rows={8}
                                  className="w-full bg-[#0a0f14] border border-[#fbbf24]/50 rounded-lg p-2.5 text-[11px] text-white outline-none resize-none"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPendingMutation({
                                      type: 'update_content',
                                      title: 'Overwrite File Contents in Google Drive?',
                                      description: `Update "${selectedFile.name}" on Google Drive with your edited content?`,
                                      fileId: selectedFile.id,
                                      fileName: selectedFile.name,
                                      content: editedContent,
                                    })
                                  }
                                  className="w-full py-1.5 rounded-lg bg-[#fbbf24] hover:bg-[#eab308] text-black font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  <span>Save Updated File</span>
                                </button>
                              </div>
                            ) : (
                              <pre className="h-48 overflow-auto bg-[#0a0f14] border border-[#1e2b36] rounded-lg p-2.5 text-[11px] text-[#dce7f0] whitespace-pre-wrap break-words">
                                {previewContent || '(Empty file)'}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center text-xs text-[#7a8b99] p-4">
                      <FileText className="w-8 h-8 text-[#38bdf8]/40 mb-2" />
                      <p>Select any file from your Google Drive list to inspect, rename, edit, or download.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
