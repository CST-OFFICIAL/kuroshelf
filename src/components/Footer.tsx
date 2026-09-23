import { siteConfig, getActiveSocials } from '../config/site';
import { Camera, Hash, Video, MessageCircle, ExternalLink, Crown, Heart } from 'lucide-react';
import { InfoModalType } from './InfoModal';

interface FooterProps {
  onNavigateTab: (tab: string, subTab?: string) => void;
  onOpenInfoModal: (type: NonNullable<InfoModalType>) => void;
  onOpenMembershipModal?: (tab?: 'membership' | 'donate') => void;
  onOpenAnnouncements?: () => void;
}

export function Footer({ onNavigateTab, onOpenInfoModal, onOpenMembershipModal, onOpenAnnouncements }: FooterProps) {
  const activeSocials = getActiveSocials();

  const handleNavClick = (tab: string, subTab?: string) => {
    onNavigateTab(tab, subTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const socialIconMap = {
    instagram: Camera,
    twitter: Hash,
    youtube: Video,
    discord: MessageCircle,
  };

  return (
    <footer className="border-t border-neutral-800/80 bg-neutral-950 mt-16 text-neutral-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
          {/* Brand & Mission Statement */}
          <div className="space-y-2.5 max-w-sm">
            <div 
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-2 cursor-pointer group select-none inline-flex"
            >
              <span className="w-6 h-6 rounded bg-rose-600 flex items-center justify-center text-white text-xs font-black shadow-sm group-hover:scale-105 transition-transform">
                黒
              </span>
              <span className="font-display font-extrabold text-white text-base tracking-tight group-hover:text-rose-400 transition-colors">
                KURO<span className="text-rose-500">SHELF</span>
              </span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              {siteConfig.description}
            </p>
          </div>

          {/* Structured Navigation Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-6 text-[11px] flex-1 max-w-3xl">
            {/* 1. Platform */}
            <div className="space-y-2">
              <span className="font-bold text-neutral-200 uppercase tracking-wider block">
                Platform
              </span>
              <div className="space-y-1.5 flex flex-col items-start">
                <button
                  type="button"
                  onClick={() => handleNavClick('home')}
                  className="text-neutral-400 hover:text-white transition-colors text-left"
                >
                  Discover
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('seasonal')}
                  className="text-neutral-400 hover:text-white transition-colors text-left"
                >
                  Seasonal Anime
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('rankings')}
                  className="text-neutral-400 hover:text-white transition-colors text-left"
                >
                  Top Rankings
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('schedule')}
                  className="text-neutral-400 hover:text-white transition-colors text-left"
                >
                  Airing Schedule
                </button>
              </div>
            </div>

            {/* 2. My Kuro Shelf */}
            <div className="space-y-2">
              <span className="font-bold text-neutral-200 uppercase tracking-wider block">
                My Kuro Shelf
              </span>
              <div className="space-y-1.5 flex flex-col items-start">
                <button
                  type="button"
                  onClick={() => handleNavClick('shelf', 'all')}
                  className="text-neutral-400 hover:text-white transition-colors text-left"
                >
                  Personal Shelf
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('shelf', 'profile')}
                  className="text-neutral-400 hover:text-white transition-colors text-left"
                >
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('shelf', 'bookmarks')}
                  className="text-neutral-400 hover:text-white transition-colors text-left"
                >
                  Bookmarks
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('shelf', 'rated')}
                  className="text-neutral-400 hover:text-white transition-colors text-left"
                >
                  Ratings
                </button>
              </div>
            </div>

            {/* 3. Community */}
            <div className="space-y-2">
              <span className="font-bold text-neutral-200 uppercase tracking-wider block">
                Community
              </span>
              <div className="space-y-1.5 flex flex-col items-start">
                <button
                  type="button"
                  onClick={() => handleNavClick('polls')}
                  className="text-neutral-400 hover:text-white transition-colors text-left"
                >
                  Prediction Polls
                </button>
                {onOpenAnnouncements && (
                  <button
                    type="button"
                    onClick={onOpenAnnouncements}
                    className="text-amber-400 hover:text-amber-300 transition-colors text-left"
                  >
                    Announcements & Notices
                  </button>
                )}
                {onOpenMembershipModal && (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpenMembershipModal('membership')}
                      className="text-amber-400 hover:text-amber-300 transition-colors text-left flex items-center gap-1"
                    >
                      <Crown className="w-3 h-3 text-amber-400" />
                      <span>Kuro VIP Plans</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenMembershipModal('donate')}
                      className="text-rose-400 hover:text-rose-300 transition-colors text-left flex items-center gap-1"
                    >
                      <Heart className="w-3 h-3 text-rose-500 fill-current" />
                      <span>Help KuroShelf Grow</span>
                    </button>
                  </>
                )}
                {/* Only render Discussions / Comments if an actual Disqus / community URL is configured */}
                {siteConfig.disqusUrl ? (
                  <a
                    href={siteConfig.disqusUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <span>Discussions / Comments</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : null}
              </div>
            </div>

            {/* 4. Legal & Info */}
            <div className="space-y-2">
              <span className="font-bold text-neutral-200 uppercase tracking-wider block">
                Legal & Info
              </span>
              <div className="space-y-1.5 flex flex-col items-start">
                <button
                  type="button"
                  onClick={() => onOpenInfoModal('about')}
                  className="text-neutral-400 hover:text-white transition-colors text-left"
                >
                  About Kuro Shelf
                </button>
                <button
                  type="button"
                  onClick={() => onOpenInfoModal('privacy')}
                  className="text-neutral-400 hover:text-white transition-colors text-left"
                >
                  Privacy Policy
                </button>
                <button
                  type="button"
                  onClick={() => onOpenInfoModal('terms')}
                  className="text-neutral-400 hover:text-white transition-colors text-left"
                >
                  Terms of Service
                </button>
                <button
                  type="button"
                  onClick={() => onOpenInfoModal('dmca')}
                  className="text-neutral-400 hover:text-white transition-colors text-left"
                >
                  DMCA & Copyright
                </button>
                <button
                  type="button"
                  onClick={() => onOpenInfoModal('cookies')}
                  className="text-neutral-400 hover:text-white transition-colors text-left"
                >
                  Cookie Policy
                </button>
                <button
                  type="button"
                  onClick={() => onOpenInfoModal('contact')}
                  className="text-neutral-400 hover:text-white transition-colors text-left"
                >
                  Contact & Support
                </button>
              </div>
            </div>

            {/* 5. Follow Kuro Shelf (Only displayed when actual URLs are configured) */}
            {activeSocials.length > 0 && (
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <span className="font-bold text-neutral-200 uppercase tracking-wider block">
                  Follow Kuro Shelf
                </span>
                <div className="space-y-1.5 flex flex-col items-start">
                  {activeSocials.map((social) => {
                    const Icon = socialIconMap[social.platform];
                    return (
                      <a
                        key={social.platform}
                        href={social.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        <Icon className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>{social.name}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Affiliate & Copyright Disclosures */}
        <div className="pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-400">
          <p>
            © {new Date().getFullYear()} Kuro Shelf. All rights reserved. Digital anime and manga library.
          </p>

          {/* Only render Amazon Associate disclosure when active */}
          {siteConfig.affiliate.amazonAssociatesActive ? (
            <p className="text-center sm:text-right max-w-lg text-neutral-400">
              {siteConfig.affiliate.disclosureText}
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
