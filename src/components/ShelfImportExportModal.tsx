import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Upload,
  Check,
  AlertCircle,
  Copy,
  FileSpreadsheet,
  RefreshCw,
  Cloud,
  HardDrive,
  Trash2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { ShelfEntry, ShelfStatus } from '../types';
import {
  DriveBackupFile,
  isGoogleDriveConnected,
  requestGoogleDriveAuth,
  disconnectGoogleDrive,
  uploadBackupToDrive,
  listDriveBackups,
  downloadBackupFromDrive,
  deleteBackupFromDrive
} from '../services/googleDriveService';

interface ShelfImportExportModalProps {
  shelf: ShelfEntry[];
  onClose: () => void;
  onImport: (newItems: ShelfEntry[], mode: 'merge' | 'replace') => void;
}

export const ShelfImportExportModal: React.FC<ShelfImportExportModalProps> = ({
  shelf,
  onClose,
  onImport,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'drive'>('export');
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importStatus, setImportStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message?: string;
    itemCount?: number;
  }>({ type: 'idle' });

  // Google Drive state
  const [driveConnected, setDriveConnected] = useState(() => isGoogleDriveConnected());
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveBackups, setDriveBackups] = useState<DriveBackupFile[]>([]);
  const [driveNotice, setDriveNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [restoringFileId, setRestoringFileId] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  // Load Drive backups whenever user opens the drive tab if connected
  useEffect(() => {
    if (activeTab === 'drive' && isGoogleDriveConnected()) {
      loadDriveBackupsList();
    }
  }, [activeTab]);

  const loadDriveBackupsList = async () => {
    try {
      setDriveLoading(true);
      const list = await listDriveBackups();
      setDriveBackups(list);
      setDriveConnected(true);
    } catch (err: any) {
      setDriveNotice({ type: 'error', message: err.message || 'Failed to list Google Drive backups.' });
      setDriveConnected(isGoogleDriveConnected());
    } finally {
      setDriveLoading(false);
    }
  };

  const handleConnectDrive = async () => {
    try {
      setDriveLoading(true);
      setDriveNotice(null);
      await requestGoogleDriveAuth();
      setDriveConnected(true);
      await loadDriveBackupsList();
      setDriveNotice({ type: 'success', message: 'Google Drive connected successfully!' });
    } catch (err: any) {
      setDriveNotice({ type: 'error', message: err.message || 'Failed to authorize Google Drive.' });
    } finally {
      setDriveLoading(false);
    }
  };

  const handleDisconnectDrive = () => {
    disconnectGoogleDrive();
    setDriveConnected(false);
    setDriveBackups([]);
    setDriveNotice({ type: 'success', message: 'Disconnected from Google Drive.' });
  };

  const handleSaveToDrive = async () => {
    if (shelf.length === 0) {
      setDriveNotice({ type: 'error', message: 'Your shelf is empty. Add titles before creating a backup.' });
      return;
    }

    try {
      setDriveLoading(true);
      setDriveNotice(null);
      const file = await uploadBackupToDrive(shelf);
      setDriveNotice({
        type: 'success',
        message: `Backup "${file.name}" saved to Google Drive with ${shelf.length} titles!`
      });
      await loadDriveBackupsList();
    } catch (err: any) {
      setDriveNotice({ type: 'error', message: err.message || 'Failed to save backup to Google Drive.' });
    } finally {
      setDriveLoading(false);
    }
  };

  const handleRestoreFromDrive = async (file: DriveBackupFile) => {
    try {
      setRestoringFileId(file.id);
      setDriveNotice(null);
      const backup = await downloadBackupFromDrive(file.id);

      if (!backup.items || backup.items.length === 0) {
        throw new Error('Backup contains no items.');
      }

      onImport(backup.items, importMode);
      setDriveNotice({
        type: 'success',
        message: `Successfully restored ${backup.items.length} titles from "${file.name}" (${importMode === 'replace' ? 'replaced' : 'merged'})!`
      });
    } catch (err: any) {
      setDriveNotice({ type: 'error', message: err.message || 'Failed to restore backup from Drive.' });
    } finally {
      setRestoringFileId(null);
    }
  };

  const handleDeleteDriveFile = async (fileId: string) => {
    try {
      setDeletingFileId(fileId);
      await deleteBackupFromDrive(fileId);
      setDriveBackups((prev) => prev.filter((f) => f.id !== fileId));
      setDriveNotice({ type: 'success', message: 'Backup file deleted from Google Drive.' });
    } catch (err: any) {
      setDriveNotice({ type: 'error', message: err.message || 'Failed to delete backup from Drive.' });
    } finally {
      setDeletingFileId(null);
    }
  };

  // Format JSON payload for Kuro Shelf
  const kuroJson = JSON.stringify(
    {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      platform: 'Kuro Shelf',
      totalItems: shelf.length,
      items: shelf,
    },
    null,
    2
  );

  const handleDownloadJson = () => {
    const blob = new Blob([kuroJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kuro-shelf-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(kuroJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parseAndImport = (content: string) => {
    try {
      const trimmed = content.trim();
      if (!trimmed) {
        setImportStatus({ type: 'error', message: 'No content to parse.' });
        return;
      }

      let parsedItems: ShelfEntry[] = [];

      // Check if MAL XML format
      if (trimmed.startsWith('<?xml') || trimmed.includes('<myanimelist>')) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(trimmed, 'text/xml');
        const animeNodes = xmlDoc.getElementsByTagName('anime');

        if (animeNodes.length === 0) {
          throw new Error('No <anime> elements found in MyAnimeList XML.');
        }

        for (let i = 0; i < animeNodes.length; i++) {
          const node = animeNodes[i];
          const malId = parseInt(node.getElementsByTagName('series_animedb_id')[0]?.textContent || '0', 10);
          const title = node.getElementsByTagName('series_title')[0]?.textContent || 'Unknown Title';
          const myScore = parseInt(node.getElementsByTagName('my_score')[0]?.textContent || '0', 10);
          const myWatchedEps = parseInt(node.getElementsByTagName('my_watched_episodes')[0]?.textContent || '0', 10);
          const rawStatus = node.getElementsByTagName('my_status')[0]?.textContent?.toLowerCase() || '';

          let status: ShelfStatus = 'plan_to_watch';
          if (rawStatus.includes('watch') || rawStatus === '1') status = 'watching';
          else if (rawStatus.includes('completed') || rawStatus === '2') status = 'completed';
          else if (rawStatus.includes('hold') || rawStatus === '3') status = 'on_hold';
          else if (rawStatus.includes('drop') || rawStatus === '4') status = 'dropped';
          else if (rawStatus.includes('plan') || rawStatus === '6') status = 'plan_to_watch';

          parsedItems.push({
            id: malId || Date.now() + i,
            mediaType: 'anime',
            title,
            image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
            status,
            userRating: myScore > 0 ? myScore : undefined,
            isLiked: false,
            progress: myWatchedEps || 0,
            updatedAt: Date.now(),
          });
        }
      } else {
        // Assume JSON format (Kuro Shelf backup or AniList JSON)
        const json = JSON.parse(trimmed);

        if (Array.isArray(json)) {
          // Array of ShelfEntry or AniList entries
          parsedItems = json.map((entry, idx) => {
            if (entry.id && entry.title && entry.status) {
              return {
                id: entry.id,
                mediaType: entry.mediaType || 'anime',
                title: entry.title,
                image: entry.image || '',
                status: entry.status,
                userRating: entry.userRating,
                isLiked: Boolean(entry.isLiked),
                progress: entry.progress || 0,
                totalUnits: entry.totalUnits,
                notes: entry.notes,
                updatedAt: entry.updatedAt || Date.now(),
              };
            }
            // AniList format
            const malId = entry.media?.idMal || entry.idMal || entry.mal_id || Date.now() + idx;
            const title = entry.media?.title?.userPreferred || entry.media?.title?.english || entry.title || 'Untitled';
            const statusMap: Record<string, ShelfStatus> = {
              CURRENT: 'watching',
              COMPLETED: 'completed',
              PAUSED: 'on_hold',
              DROPPED: 'dropped',
              PLANNING: 'plan_to_watch',
            };
            const status: ShelfStatus = statusMap[entry.status] || 'plan_to_watch';

            return {
              id: malId,
              mediaType: 'anime',
              title,
              image: entry.media?.coverImage?.large || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
              status,
              userRating: entry.score || entry.userRating || undefined,
              isLiked: false,
              progress: entry.progress || 0,
              updatedAt: Date.now(),
            };
          });
        } else if (json.items && Array.isArray(json.items)) {
          // Standard Kuro Shelf export
          parsedItems = json.items.map((it: any) => ({
            id: it.id || it.anime?.mal_id || Date.now(),
            mediaType: it.mediaType || 'anime',
            title: it.title || it.anime?.title || 'Untitled',
            image: it.image || it.anime?.images?.jpg?.image_url || '',
            status: it.status || 'plan_to_watch',
            userRating: it.userRating,
            isLiked: Boolean(it.isLiked),
            progress: it.progress || it.episodesWatched || 0,
            totalUnits: it.totalUnits || it.anime?.episodes,
            notes: it.notes,
            updatedAt: it.updatedAt || Date.now(),
          }));
        } else {
          throw new Error('Unsupported JSON schema. Expected Kuro Shelf items array or AniList export.');
        }
      }

      if (parsedItems.length === 0) {
        throw new Error('No valid anime entries were parsed.');
      }

      onImport(parsedItems, importMode);
      setImportStatus({
        type: 'success',
        message: `Successfully imported ${parsedItems.length} titles into your shelf!`,
        itemCount: parsedItems.length,
      });
      setImportText('');
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: err.message || 'Failed to parse import data. Please verify the format.',
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) {
        setImportText(text);
        parseAndImport(text);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div
        id="import-export-modal"
        className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl my-auto text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-900 border-b border-neutral-800 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white">Library Backup & Migration</h2>
            <p className="text-xs sm:text-sm text-neutral-400">
              Export your Kuro Shelf collection or import libraries from MyAnimeList and AniList.
            </p>
          </div>

          <button
            id="close-import-export-btn"
            onClick={onClose}
            className="p-2 rounded-full bg-neutral-950/80 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40">
          <button
            id="tab-export"
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-3 px-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-rose-500 text-rose-400 bg-neutral-900/50'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Export Library ({shelf.length})</span>
          </button>
          <button
            id="tab-import"
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-3 px-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-rose-500 text-rose-400 bg-neutral-900/50'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Import / Restore</span>
          </button>
          <button
            id="tab-drive"
            onClick={() => setActiveTab('drive')}
            className={`flex-1 py-3 px-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'drive'
                ? 'border-rose-500 text-rose-400 bg-neutral-900/50'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Cloud className="w-4 h-4 text-blue-400" />
            <span className="flex items-center gap-1.5">
              <span>Google Drive</span>
              {driveConnected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              )}
            </span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-6">
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-rose-400" />
                    <span className="text-sm font-bold text-white">Full JSON Backup</span>
                  </div>
                  <span className="text-xs text-neutral-400 font-mono">{shelf.length} titles recorded</span>
                </div>
                <p className="text-xs text-neutral-400">
                  Save your complete watch status, scores, ratings, timestamps, and custom episode progress to a portable JSON file.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    id="export-download-btn"
                    onClick={handleDownloadJson}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JSON File</span>
                  </button>

                  <button
                    id="export-copy-btn"
                    onClick={handleCopyClipboard}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy to Clipboard</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Preview snippet */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-neutral-400">Backup Preview</span>
                <pre className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-[11px] text-neutral-300 font-mono max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800">
                  {kuroJson.slice(0, 500)}
                  {kuroJson.length > 500 ? '\n... [more items truncated]' : ''}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-5">
              {/* File upload drag drop zone */}
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-neutral-700 hover:border-rose-500/60 rounded-xl bg-neutral-950/60 hover:bg-neutral-950 cursor-pointer transition-all space-y-2 group"
              >
                <Upload className="w-8 h-8 text-neutral-500 group-hover:text-rose-400 transition-colors" />
                <div className="text-xs sm:text-sm font-semibold text-neutral-200 text-center">
                  Drop XML or JSON backup file here, or click to browse
                </div>
                <div className="text-[11px] text-neutral-500 text-center">
                  Supports MyAnimeList export XML, AniList export JSON, and Kuro Shelf JSON
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept=".xml,.json,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Or paste content directly */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-300">Or Paste XML / JSON Data</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-neutral-400">Import Mode:</span>
                    <select
                      value={importMode}
                      onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                      className="bg-neutral-950 border border-neutral-800 text-[11px] text-white rounded px-2 py-1"
                    >
                      <option value="merge">Merge (Keep existing titles)</option>
                      <option value="replace">Replace (Overwrite current shelf)</option>
                    </select>
                  </div>
                </div>

                <textarea
                  id="import-text-input"
                  rows={4}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste MyAnimeList XML or Kuro Shelf JSON data here..."
                  className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 font-mono focus:outline-none focus:border-rose-500"
                />

                <button
                  id="submit-import-btn"
                  onClick={() => parseAndImport(importText)}
                  disabled={!importText.trim()}
                  className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Parse & Import Titles</span>
                </button>
              </div>

              {/* Status Message */}
              {importStatus.type !== 'idle' && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs ${
                    importStatus.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}
                >
                  {importStatus.type === 'success' ? (
                    <Check className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{importStatus.message}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'drive' && (
            <div className="space-y-5">
              {/* Drive Connection Status Header */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    driveConnected
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                  }`}>
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">Google Drive Cloud Sync</h4>
                      {driveConnected && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Connected
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {driveConnected
                        ? 'Back up and restore your collection directly to your Google Drive account.'
                        : 'Connect your Google account to back up and restore your shelf seamlessly.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {!driveConnected ? (
                    <button
                      id="connect-google-drive-btn"
                      type="button"
                      onClick={handleConnectDrive}
                      disabled={driveLoading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-blue-900/30 cursor-pointer"
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      <span>{driveLoading ? 'Connecting...' : 'Connect Drive'}</span>
                    </button>
                  ) : (
                    <button
                      id="disconnect-google-drive-btn"
                      type="button"
                      onClick={handleDisconnectDrive}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-rose-400 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </div>

              {/* Status Notice if any */}
              {driveNotice && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-2.5 text-xs ${
                    driveNotice.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {driveNotice.type === 'success' ? (
                      <Check className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{driveNotice.message}</span>
                  </div>
                  <button
                    onClick={() => setDriveNotice(null)}
                    className="text-neutral-500 hover:text-neutral-300 text-xs px-1"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Action: Create Backup Now */}
              {driveConnected && (
                <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-white">Save Current Shelf to Drive</h5>
                      <p className="text-[11px] text-neutral-400">
                        Uploads a timestamped snapshot of your {shelf.length} titles.
                      </p>
                    </div>
                    <button
                      id="backup-to-drive-btn"
                      type="button"
                      onClick={handleSaveToDrive}
                      disabled={driveLoading || shelf.length === 0}
                      className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-rose-900/30 cursor-pointer"
                    >
                      {driveLoading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Backup Now ({shelf.length})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Drive Backups List */}
              {driveConnected && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-neutral-400" />
                      <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                        Saved Backups in Google Drive
                      </h5>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-neutral-500 text-[11px]">Restore Mode:</span>
                        <select
                          value={importMode}
                          onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                          className="bg-neutral-950 border border-neutral-800 text-[11px] text-white rounded px-2 py-0.5"
                        >
                          <option value="merge">Merge</option>
                          <option value="replace">Replace</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={loadDriveBackupsList}
                        disabled={driveLoading}
                        className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                        title="Refresh Drive backups list"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${driveLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {driveBackups.length === 0 ? (
                    <div className="p-8 text-center rounded-xl bg-neutral-950/40 border border-neutral-800/60 text-neutral-500 text-xs">
                      <Cloud className="w-8 h-8 mx-auto text-neutral-600 mb-2" />
                      <p>No Kuro Shelf backups found in your Google Drive.</p>
                      <p className="text-[11px] text-neutral-600 mt-1">
                        Click "Backup Now" above to create your first cloud snapshot.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-800/80 rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden">
                      {driveBackups.map((file) => (
                        <div
                          key={file.id}
                          className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-900/50 transition-colors"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-white font-mono">{file.name}</span>
                              {file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-neutral-500 hover:text-blue-400"
                                  title="View file in Google Drive"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-neutral-400">
                              <span>Modified: {new Date(file.modifiedTime).toLocaleString()}</span>
                              {file.size && (
                                <span>{Math.round(parseInt(file.size, 10) / 1024)} KB</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => handleRestoreFromDrive(file)}
                              disabled={restoringFileId === file.id}
                              className="px-3 py-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {restoringFileId === file.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Download className="w-3 h-3" />
                              )}
                              <span>Restore</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteDriveFile(file.id)}
                              disabled={deletingFileId === file.id}
                              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-red-950/40 border border-neutral-800 hover:border-red-900/60 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                              title="Delete this backup from Drive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Informational security note */}
              <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-900/30 flex items-start gap-2.5 text-xs text-blue-200/80">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-blue-300">Privacy & Access Guarantee</span>
                  <p className="text-[11px] text-blue-200/70 leading-relaxed">
                    Kuro Shelf only accesses files created specifically by this app (<code className="font-mono text-blue-300">drive.file</code> scope). Your other Google Drive personal documents remain completely private and inaccessible.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
