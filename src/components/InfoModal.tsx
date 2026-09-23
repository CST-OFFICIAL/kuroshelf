import { useState, useEffect } from 'react';
import { X, Mail, Shield, FileText, Info, Copy, Check, ExternalLink, AlertTriangle, Cookie, Scale } from 'lucide-react';
import { siteConfig } from '../config/site';

export type InfoModalType = 'about' | 'privacy' | 'terms' | 'dmca' | 'cookies' | 'contact' | null;

interface InfoModalProps {
  type: InfoModalType;
  onClose: () => void;
}

export function InfoModal({ type, onClose }: InfoModalProps) {
  // Lock body and html scroll only when modal is open
  useEffect(() => {
    if (!type) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBody || '';
      document.documentElement.style.overflow = prevHtml || '';
    };
  }, [type]);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs overflow-y-auto overscroll-contain animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id={`info-modal-${type}`}
        className="relative w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col overscroll-contain"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            {type === 'about' && <Info className="w-5 h-5 text-rose-500" />}
            {type === 'privacy' && <Shield className="w-5 h-5 text-rose-500" />}
            {type === 'terms' && <FileText className="w-5 h-5 text-rose-500" />}
            {type === 'dmca' && <Scale className="w-5 h-5 text-rose-500" />}
            {type === 'cookies' && <Cookie className="w-5 h-5 text-rose-500" />}
            {type === 'contact' && <Mail className="w-5 h-5 text-rose-500" />}
            <h2 className="text-base font-bold text-white font-display">
              {type === 'about' && 'About Kuro Shelf'}
              {type === 'privacy' && 'Privacy Policy'}
              {type === 'terms' && 'Terms of Service'}
              {type === 'dmca' && 'DMCA & Copyright Policy'}
              {type === 'cookies' && 'Cookie Policy'}
              {type === 'contact' && 'Contact & Support'}
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
          
          {/* ABOUT */}
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
                  Kuro Shelf is a modern anime and manga discovery, personal tracking, and community platform built for fans who value a clean, responsive, and privacy-respecting digital library.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white font-display">Our Mission</h3>
                <p>
                  To provide an independent catalog where anime enthusiasts can discover premiering titles, organize their personal watching progress across customizable shelf categories, participate in community prediction polls, and check legitimate streaming availability without intrusive popups or disruptive ads.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white font-display">Core Pillars</h3>
                <ul className="list-disc pl-5 space-y-1.5 text-neutral-400">
                  <li><strong className="text-neutral-200">Independent Identity:</strong> Original user experience designed specifically for clarity, speed, and dark-mode elegance.</li>
                  <li><strong className="text-neutral-200">Local-First & Cloud Sync:</strong> Seamlessly organizes your shelf locally in your browser, with optional cloud backup via secure authentication.</li>
                  <li><strong className="text-neutral-200">Verified Catalog Metadata:</strong> Aggregating global anime and manga metadata, official broadcast timetables, and licensed where-to-watch streaming directories.</li>
                  <li><strong className="text-neutral-200">Community Driven:</strong> Interactive prediction polls, custom themes, and daily streaks celebrating our collective love for anime.</li>
                </ul>
              </div>
            </div>
          )}

          {/* PRIVACY POLICY */}
          {type === 'privacy' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold block">Effective Date: September 2026</span>
                  <h3 className="text-sm font-bold text-white font-display mt-0.5">Privacy Policy</h3>
                </div>
                <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20 font-medium">GDPR & CCPA Compliant</span>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-semibold text-neutral-200">1. Information We Collect</h4>
                <p>
                  Kuro Shelf is designed with minimal data collection principles:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-neutral-400">
                  <li><strong className="text-neutral-300">Local Device Data:</strong> When browsing as a guest, your personal shelf entries, watch progress, bookmarks, and UI settings are stored exclusively in your browser&apos;s local storage. This data never leaves your device.</li>
                  <li><strong className="text-neutral-300">Account Credentials:</strong> If you register or authenticate using email or single sign-on, our cloud infrastructure securely receives your email address and profile identifiers to sync your personal shelf. We do not store plaintext passwords.</li>
                  <li><strong className="text-neutral-300">Technical Logs:</strong> Global edge delivery networks may record standard, temporary HTTP connection logs (IP address, user-agent, request path) strictly for network security, DDoS prevention, and rate-limiting.</li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-semibold text-neutral-200">2. How We Use Information</h4>
                <p>
                  Information is used exclusively to deliver core features: displaying your personal anime shelf, maintaining episode tracking, calculating community poll distributions, and enabling optional VIP profile customizations. We never sell, rent, or trade your personal data to advertisers or third-party brokers.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-semibold text-neutral-200">3. Infrastructure & Processing</h4>
                <p>
                  Kuro Shelf utilizes secure cloud infrastructure to provide content and database functionality:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-neutral-400">
                  <li><strong className="text-neutral-300">Public Media Directory:</strong> Anime and manga metadata, broadcast schedules, and character information are gathered via open media directories. No personally identifiable user information is transmitted during these catalog queries.</li>
                  <li><strong className="text-neutral-300">Encrypted Cloud Storage:</strong> Account authentication and cloud sync are protected under strict international security standards and industry encryption practices.</li>
                  <li><strong className="text-neutral-300">Secure Payment Gateways:</strong> Any voluntary supporter contributions or VIP memberships are processed securely through certified, PCI-DSS compliant payment gateways. Kuro Shelf never sees or retains your credit card numbers or banking secrets.</li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-semibold text-neutral-200">4. Your Data Rights & Deletion</h4>
                <p>
                  You hold full ownership of your data. You can export or wipe your entire shelf at any time via the Shelf Settings modal. To request permanent deletion of your account and synchronized cloud data, email us with your registered account handle.
                </p>
              </div>
            </div>
          )}

          {/* TERMS OF SERVICE */}
          {type === 'terms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold block">Effective Date: September 2026</span>
                  <h3 className="text-sm font-bold text-white font-display mt-0.5">Terms of Service</h3>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-semibold text-neutral-200">1. Acceptance of Terms</h4>
                <p>
                  By accessing or utilizing Kuro Shelf, you agree to comply with and be bound by these Terms of Service. If you do not agree, please discontinue using the platform.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-semibold text-neutral-200">2. Informational & Indexing Purpose Only</h4>
                <p>
                  Kuro Shelf is strictly an anime & manga metadata indexing, personal tracking, and review platform. 
                  <strong className="text-rose-400 block mt-1">
                    Kuro Shelf DOES NOT host, upload, rip, encode, torrent, or stream any full video media, audio episodes, or copyrighted broadcast files.
                  </strong>
                  All streaming buttons and watch links redirect users directly to official, licensed third-party distributors and broadcaster portals.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-semibold text-neutral-200">3. Intellectual Property Rights</h4>
                <p>
                  All anime posters, promotional key visuals, character names, studio trademarks, and synopses belong to their respective copyright holders, authors, and production committees. Kuro Shelf uses this media under Fair Use / Nominative Use doctrine for educational, cataloging, and commentary purposes.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-semibold text-neutral-200">4. Community Guidelines & Conduct</h4>
                <p>
                  Users participating in community prediction polls, discussions, or custom profiles agree to conduct themselves respectfully. Automated bot voting, script attacks, harassment, hate speech, upload of inappropriate avatar imagery, or attempts to disrupt service stability will result in immediate suspension.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-semibold text-neutral-200">5. Disclaimer of Warranties & Limitation of Liability</h4>
                <p>
                  The platform is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind. Kuro Shelf will not be held liable for any data loss, downtime, or discrepancies in third-party broadcast schedules.
                </p>
              </div>
            </div>
          )}

          {/* DMCA & COPYRIGHT */}
          {type === 'dmca' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold block">Notice & Takedown</span>
                  <h3 className="text-sm font-bold text-white font-display mt-0.5">DMCA & Copyright Policy</h3>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  Kuro Shelf respects the intellectual property rights of creators and rights holders. We comply fully with the Digital Millennium Copyright Act (17 U.S.C. § 512) and international copyright legislation.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-semibold text-neutral-200">No Hosted Media</h4>
                <p>
                  Kuro Shelf operates as an informational directory and personal watch list. We do not maintain or distribute video files or digital manga scans on our servers. All media metadata (posters, character images) is retrieved via official third-party indexing APIs for non-commercial identification purposes.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-semibold text-neutral-200">Submitting a Takedown Notice</h4>
                <p>
                  If you are a copyright owner or an authorized agent and believe that content hosted on or linked by Kuro Shelf infringes upon your copyright, please provide a written communication containing:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-neutral-400">
                  <li>Identification of the copyrighted work claimed to have been infringed.</li>
                  <li>Identification of the specific URL or metadata item on Kuro Shelf you request removed.</li>
                  <li>Your full legal name, company name, physical address, email address, and telephone number.</li>
                  <li>A statement that you have a good-faith belief that use of the material is not authorized by the copyright owner.</li>
                  <li>A physical or electronic signature of the authorized copyright holder or legal representative.</li>
                </ol>
                <p className="mt-2 text-neutral-300">
                  Send DMCA notifications directly to: <span className="font-mono text-rose-400 font-semibold">{siteConfig.contactEmail || 'dmca@kuroshelf.com'}</span>. We process verified takedown notices within 24–48 business hours.
                </p>
              </div>
            </div>
          )}

          {/* COOKIES */}
          {type === 'cookies' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold block">Browser Storage</span>
                  <h3 className="text-sm font-bold text-white font-display mt-0.5">Cookie & Local Storage Policy</h3>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-semibold text-neutral-200">What We Store</h4>
                <p>
                  Unlike most websites, Kuro Shelf does not use invasive cross-site advertising cookies or behavioral tracking beacons. We rely almost entirely on standard browser <strong>LocalStorage</strong> to save your experience locally.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-neutral-200">Breakdown of Stored Preferences:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                    <strong className="text-neutral-100 block">Personal Shelf Items</strong>
                    Saves your watched episodes, reading status, and favorites locally on your device.
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                    <strong className="text-neutral-100 block">UI Theme & Density</strong>
                    Remembers dark mode, AMOLED black, and grid size preferences.
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                    <strong className="text-neutral-100 block">Auth Session Token</strong>
                    Encrypted authentication session token used only to keep your profile signed in.
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                    <strong className="text-neutral-100 block">Daily Streak Tracker</strong>
                    Logs timestamps of your daily visit to reward you with shelf milestones.
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-semibold text-neutral-200">Managing Your Storage</h4>
                <p>
                  You can clear these stored preferences at any time by clearing your browser cache/cookies or clicking &quot;Reset Shelf&quot; in the Kuro Shelf settings.
                </p>
              </div>
            </div>
          )}

          {/* CONTACT & SUPPORT */}
          {type === 'contact' && (
            <div className="space-y-5">
              <p>
                Have a question, feedback, feature proposal, or metadata correction? Reach out to the Kuro Shelf development team directly.
              </p>

              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                  Official Communication Channel
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
                      <span>Contact details & email</span>
                    </div>
                    <p className="text-neutral-400 text-xs">
                      You can configure your custom contact address anytime in your deployment environment variables via <code className="text-rose-400 font-mono">VITE_CONTACT_EMAIL</code>.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-neutral-200">Inquiry Categories We Prioritize</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-neutral-400">
                  <div className="p-2.5 rounded-lg bg-neutral-900/40 border border-neutral-800/80">
                    <strong className="text-neutral-200 block">Catalog & Metadata</strong>
                    Missing anime seasons, schedule timing errors, or new streaming links.
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-900/40 border border-neutral-800/80">
                    <strong className="text-neutral-200 block">Community & Feedback</strong>
                    Feature requests, prediction poll suggestions, or UI improvements.
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
