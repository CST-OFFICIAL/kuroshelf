import { useState, useEffect } from 'react';
import { X, Mail, Shield, FileText, Info, Copy, Check, ExternalLink } from 'lucide-react';
import { siteConfig } from '../config/site';

export type InfoModalType = 'about' | 'privacy' | 'terms' | 'contact' | null;

interface InfoModalProps {
  type: InfoModalType;
  onClose: () => void;
}

export function InfoModal({ type, onClose }: InfoModalProps) {
  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!type) return null;

  const hasContactEmail = Boolean(siteConfig.contactEmail && siteConfig.contactEmail.trim());

  const handleCopyEmail = () => {
    if (hasContactEmail && navigator.clipboard) {
      navigator.clipboard.writeText(siteConfig.contactEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id={`info-modal-${type}`}
        className="relative w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-neutral-900/60 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            {type === 'about' && <Info className="w-5 h-5 text-rose-500" />}
            {type === 'privacy' && <Shield className="w-5 h-5 text-rose-500" />}
            {type === 'terms' && <FileText className="w-5 h-5 text-rose-500" />}
            {type === 'contact' && <Mail className="w-5 h-5 text-rose-500" />}
            <h2 className="text-base font-bold text-white font-display">
              {type === 'about' && 'About Kuro Shelf'}
              {type === 'privacy' && 'Privacy Policy'}
              {type === 'terms' && 'Terms of Service'}
              {type === 'contact' && 'Contact Kuro Shelf'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-neutral-300 leading-relaxed font-sans">
          {type === 'about' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-rose-600 flex items-center justify-center text-white text-xs font-black">
                    黒
                  </span>
                  <span className="font-display font-extrabold text-white text-sm">
                    KURO<span className="text-rose-500">SHELF</span>
                  </span>
                </div>
                <p className="text-neutral-300">
                  Kuro Shelf is a modern anime and manga discovery, tracking, and community platform built for fans who want a clean, responsive digital library.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white font-display">Our Mission</h3>
                <p>
                  To provide an independent catalog where anime enthusiasts can discover premiering titles, organize their personal watching progress across customizable shelf categories, participate in community prediction polls, and check legitimate streaming availability.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white font-display">Key Pillars</h3>
                <ul className="list-disc pl-5 space-y-1 text-neutral-400">
                  <li><strong className="text-neutral-200">Independent Identity:</strong> Original user experience designed specifically for clarity, speed, and dark-mode elegance.</li>
                  <li><strong className="text-neutral-200">Local-First Privacy:</strong> Your shelf entries and ratings reside safely in your browser storage.</li>
                  <li><strong className="text-neutral-200">Verified Information:</strong> Aggregating global anime and manga metadata, official broadcast timetables, and licensed where-to-watch streaming directories.</li>
                  <li><strong className="text-neutral-200">Community Driven:</strong> Real-time prediction polls for upcoming season highlights, battles, and milestones.</li>
                </ul>
              </div>
            </div>
          )}

          {type === 'privacy' && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold block">Last Updated: September 2026</span>
                <h3 className="text-sm font-bold text-white font-display mt-1">Our Privacy Commitment</h3>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-neutral-200">1. Data Storage & Local Shelf</h4>
                <p>
                  Kuro Shelf operates with a local-first architecture. Your personal shelf entries, watch statuses, episode counts, custom ratings, and poll votes are stored directly in your browser&apos;s local storage. This data remains on your device and is not sold, rented, or shared with third-party data brokers.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-neutral-200">2. External Services & APIs</h4>
                <p>
                  To provide comprehensive anime and manga listings, search results, and cover artwork, Kuro Shelf queries verified external metadata providers. These queries transmit only the necessary search terms or item identifiers required to retrieve catalog information.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-neutral-200">3. Cookies & Tracking</h4>
                <p>
                  Kuro Shelf does not deploy intrusive cross-site advertising trackers or profiling cookies. Any state retained by the browser is strictly functional to ensure your shelf and viewing preferences persist across sessions.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-neutral-200">4. Contact Inquiries</h4>
                <p>
                  If you contact Kuro Shelf via our official email, your email address is used solely to respond to your inquiry and will never be shared without your explicit consent.
                </p>
              </div>
            </div>
          )}

          {type === 'terms' && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold block">Last Updated: September 2026</span>
                <h3 className="text-sm font-bold text-white font-display mt-1">Terms of Service</h3>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-neutral-200">1. Platform Purpose</h4>
                <p>
                  Kuro Shelf is an informational and organizational catalog for anime and manga. Kuro Shelf does not host, stream, or distribute video files or copyrighted media on its servers. All streaming links direct to official, legitimate third-party platforms.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-neutral-200">2. Intellectual Property</h4>
                <p>
                  All anime posters, studio logos, character names, and descriptive synopses belong to their respective copyright owners, production committees, and authors. Their presence on Kuro Shelf is for discovery and informational commentary purposes.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-neutral-200">3. Community Conduct</h4>
                <p>
                  Users participating in prediction polls and community discussions agree to engage respectfully. Spamming, vote manipulation, hate speech, or harassment is strictly prohibited.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-neutral-200">4. External Links</h4>
                <p>
                  Kuro Shelf may link to external websites, including official streaming services, publishers, and retailers. We are not responsible for the content, privacy practices, or availability of external destinations.
                </p>
              </div>
            </div>
          )}

          {type === 'contact' && (
            <div className="space-y-5">
              <p>
                Have feedback, a feature request, or an inquiry regarding catalog listings? Reach out to the Kuro Shelf team directly.
              </p>

              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                  Official Contact Channel
                </span>
                {hasContactEmail ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="text-xs font-mono font-medium text-neutral-100 select-all">
                        {siteConfig.contactEmail}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyEmail}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-neutral-400" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      <a
                        href={`mailto:${siteConfig.contactEmail}?subject=Kuro%20Shelf%20Inquiry`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors"
                      >
                        <span>Send Mail</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs leading-relaxed space-y-1.5">
                    <div className="flex items-center gap-2 text-rose-400 font-semibold">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span>Contact details coming soon</span>
                    </div>
                    <p className="text-neutral-400 text-xs">
                      Official email and inquiry channels for Kuro Shelf are currently being configured. Dedicated support, catalog corrections, and partnership inquiries will become available once domain email accounts are established.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-neutral-200">Topics We Handle</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-neutral-400">
                  <div className="p-2.5 rounded-lg bg-neutral-900/40 border border-neutral-800/80">
                    <strong className="text-neutral-200 block">Corrections & Metadata</strong>
                    Report missing titles, updated broadcast slots, or where-to-watch platforms.
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-900/40 border border-neutral-800/80">
                    <strong className="text-neutral-200 block">Feature Feedback</strong>
                    Share ideas for prediction polls, shelf filters, or UI improvements.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3 border-t border-neutral-800/80 bg-neutral-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
