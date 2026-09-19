import React from 'react';

interface NormalBannerArtProps {
  themeId: string;
}

export const NormalBannerArt: React.FC<NormalBannerArtProps> = ({ themeId }) => {
  switch (themeId) {
    case 'cyberpunk':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          {/* Cyberpunk Neon Skyline & Grid */}
          <svg viewBox="0 0 1000 300" className="w-full h-full object-cover opacity-60" fill="none">
            {/* Tower silhouettes */}
            <rect x="60" y="80" width="70" height="220" fill="#090d16" />
            <rect x="150" y="50" width="90" height="250" fill="#050811" />
            <rect x="260" y="110" width="60" height="190" fill="#0f172a" />
            <rect x="650" y="70" width="80" height="230" fill="#050811" />
            <rect x="750" y="40" width="110" height="260" fill="#090d16" />
            <rect x="880" y="90" width="70" height="210" fill="#050811" />
            {/* Windows / Cyber Neon Lines */}
            <line x1="160" y1="60" x2="160" y2="280" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3 6" opacity="0.7" />
            <line x1="220" y1="80" x2="220" y2="270" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4 8" opacity="0.8" />
            <line x1="770" y1="50" x2="770" y2="280" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="3 5" opacity="0.7" />
            <line x1="840" y1="70" x2="840" y2="290" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="5 9" opacity="0.8" />
            {/* Holo Kanji Billboard */}
            <text x="180" y="140" fill="#06b6d4" fontSize="24" fontWeight="bold" opacity="0.7" fontFamily="sans-serif">
              未来
            </text>
            <text x="800" y="120" fill="#f43f5e" fontSize="28" fontWeight="bold" opacity="0.6" fontFamily="sans-serif">
              電脳
            </text>
            {/* Perspective grid floor */}
            <line x1="0" y1="280" x2="1000" y2="280" stroke="#06b6d4" strokeWidth="1" opacity="0.5" />
            <line x1="0" y1="295" x2="1000" y2="295" stroke="#f43f5e" strokeWidth="1.5" opacity="0.6" />
          </svg>
        </div>
      );

    case 'sakura_dusk':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          {/* Giant Full Moon & Torii Gate Silhouette */}
          <svg viewBox="0 0 1000 300" className="w-full h-full object-cover" fill="none">
            {/* Radiant Moon */}
            <circle cx="820" cy="110" r="85" fill="#fce7f3" fillOpacity="0.15" />
            <circle cx="820" cy="110" r="65" fill="#fdf2f8" fillOpacity="0.3" />
            <circle cx="820" cy="110" r="50" fill="#ffffff" fillOpacity="0.7" />
            {/* Torii Gate Silhouette */}
            <g transform="translate(680, 120) scale(0.65)">
              <rect x="40" y="30" width="160" height="14" rx="2" fill="#180410" />
              <rect x="25" y="10" width="190" height="16" rx="4" fill="#0f020a" />
              <rect x="65" y="44" width="14" height="160" fill="#180410" />
              <rect x="160" y="44" width="14" height="160" fill="#180410" />
              <rect x="50" y="70" width="140" height="12" fill="#0f020a" />
            </g>
            {/* Mountain Range */}
            <path d="M0,280 Q250,190 500,270 Q750,180 1000,280 L1000,300 L0,300 Z" fill="#0d010c" opacity="0.8" />
            {/* Drifting Sakura Petals */}
            <g fill="#f472b6" opacity="0.75">
              <ellipse cx="320" cy="80" rx="6" ry="3" transform="rotate(35 320 80)" />
              <ellipse cx="450" cy="130" rx="5" ry="2.5" transform="rotate(-20 450 130)" />
              <ellipse cx="600" cy="65" rx="7" ry="3.5" transform="rotate(45 600 65)" />
              <ellipse cx="780" cy="190" rx="6" ry="3" transform="rotate(15 780 190)" />
              <ellipse cx="200" cy="160" rx="5" ry="2.5" transform="rotate(-40 200 160)" />
            </g>
          </svg>
        </div>
      );

    case 'shonen_ember':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          {/* Dynamic Anime Impact Speedlines & Embers */}
          <svg viewBox="0 0 1000 300" className="w-full h-full object-cover" fill="none">
            {/* Speedline Rays converging from left */}
            <line x1="0" y1="150" x2="1000" y2="20" stroke="#f59e0b" strokeWidth="1" opacity="0.2" />
            <line x1="0" y1="150" x2="1000" y2="80" stroke="#ef4444" strokeWidth="1.5" opacity="0.25" />
            <line x1="0" y1="150" x2="1000" y2="220" stroke="#f59e0b" strokeWidth="1.5" opacity="0.2" />
            <line x1="0" y1="150" x2="1000" y2="290" stroke="#ef4444" strokeWidth="1" opacity="0.3" />
            {/* Fiery Embers */}
            <g fill="#fbbf24">
              <circle cx="250" cy="90" r="3" opacity="0.8" />
              <circle cx="480" cy="160" r="4" opacity="0.9" />
              <circle cx="680" cy="70" r="2.5" opacity="0.7" />
              <circle cx="820" cy="190" r="3.5" opacity="0.8" />
              <circle cx="390" cy="240" r="2" opacity="0.6" />
            </g>
          </svg>
        </div>
      );

    case 'manga_screentone':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          {/* Screentone Halftone Pattern & Action Speedlines */}
          <svg viewBox="0 0 1000 300" className="w-full h-full object-cover opacity-35" fill="none">
            <defs>
              <pattern id="manga_dots" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                <circle cx="6" cy="6" r="2" fill="#ffffff" />
              </pattern>
            </defs>
            <rect width="1000" height="300" fill="url(#manga_dots)" />
            {/* Action Speedlines */}
            <path d="M700 0 L1000 0 L1000 300 Z" fill="#000000" opacity="0.5" />
            <line x1="500" y1="0" x2="900" y2="300" stroke="#ffffff" strokeWidth="2" strokeDasharray="15 10" />
            <line x1="550" y1="0" x2="950" y2="300" stroke="#ffffff" strokeWidth="1" strokeDasharray="20 15" />
          </svg>
        </div>
      );

    case 'ghibli_emerald':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          {/* Ethereal Forest Canopy & Glowing Spirit Orbs */}
          <svg viewBox="0 0 1000 300" className="w-full h-full object-cover" fill="none">
            {/* Trees & Foliage Silhouette */}
            <path d="M0 300 L0 180 Q100 130 200 190 Q300 100 450 170 Q600 80 800 160 Q900 120 1000 170 L1000 300 Z" fill="#021a12" opacity="0.85" />
            {/* Glowing Kodama / Forest Spirit Orbs */}
            <g fill="#34d399">
              <circle cx="340" cy="130" r="5" fillOpacity="0.8" />
              <circle cx="340" cy="130" r="10" fillOpacity="0.2" />
              <circle cx="620" cy="110" r="4" fillOpacity="0.9" />
              <circle cx="620" cy="110" r="8" fillOpacity="0.3" />
              <circle cx="790" cy="90" r="6" fillOpacity="0.7" />
              <circle cx="210" cy="170" r="3.5" fillOpacity="0.8" />
            </g>
          </svg>
        </div>
      );

    case 'synthwave':
    default:
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          {/* Synthwave Horizon Wireframe & Neon Sun */}
          <svg viewBox="0 0 1000 300" className="w-full h-full object-cover opacity-50" fill="none">
            {/* Neon Wireframe Sun */}
            <circle cx="500" cy="140" r="65" fill="#f43f5e" />
            {/* Horizontal Sun Bars */}
            <rect x="420" y="145" width="160" height="4" fill="#090514" />
            <rect x="425" y="155" width="150" height="6" fill="#090514" />
            <rect x="435" y="167" width="130" height="8" fill="#090514" />
            <rect x="450" y="181" width="100" height="10" fill="#090514" />
            {/* Horizon Grid */}
            <line x1="0" y1="200" x2="1000" y2="200" stroke="#a855f7" strokeWidth="2" />
            <line x1="0" y1="230" x2="1000" y2="230" stroke="#a855f7" strokeWidth="1" />
            <line x1="0" y1="265" x2="1000" y2="265" stroke="#a855f7" strokeWidth="1" />
          </svg>
        </div>
      );
  }
};
