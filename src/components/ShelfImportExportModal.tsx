import React, { useState } from 'react';
import { X, Download, Upload, Check, AlertCircle, Copy, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { ShelfEntry, ShelfStatus } from '../types';

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
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importStatus, setImportStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message?: string;
    itemCount?: number;
  }>({ type: 'idle' });

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
        </div>
      </div>
    </div>
  );
};
