import React from 'react';

interface NormalBannerArtProps {
  themeId: string;
}

export const NormalBannerArt: React.FC<NormalBannerArtProps> = ({ themeId }) => {
  switch (themeId) {
    case 'midnight_obsidian':
    case 'midnight_slate':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <svg viewBox="0 0 1000 300" className="w-full h-full object-cover opacity-35" fill="none">
            {/* Subtle Luxury Micro Grid */}
            <defs>
              <pattern id="obsidian_grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#475569" strokeWidth="0.6" opacity="0.3" />
              </pattern>
              <radialGradient id="obsidian_glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#334155" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#090a0f" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="1000" height="300" fill="url(#obsidian_grid)" />
            <circle cx="800" cy="80" r="280" fill="url(#obsidian_glow)" />
            <circle cx="150" cy="220" r="180" fill="url(#obsidian_glow)" />
            {/* Fine architectural diagonal accent line */}
            <line x1="0" y1="280" x2="1000" y2="40" stroke="#64748b" strokeWidth="0.8" opacity="0.25" />
          </svg>
        </div>
      );

    case 'tokyo_rain':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <svg viewBox="0 0 1000 300" className="w-full h-full object-cover opacity-45" fill="none">
            {/* Distant Minimalist City Skyline Silhouettes */}
            <rect x="120" y="160" width="45" height="140" fill="#0c1527" />
            <rect x="180" y="130" width="60" height="170" fill="#080f1e" />
            <rect x="250" y="170" width="35" height="130" fill="#0f1d36" />
            <rect x="680" y="120" width="70" height="180" fill="#091122" />
            <rect x="765" y="150" width="50" height="150" fill="#0e1b33" />
            <rect x="830" y="135" width="40" height="165" fill="#0a1326" />
            {/* Rain Strands */}
            <g stroke="#38bdf8" strokeWidth="0.8" opacity="0.25">
              <line x1="100" y1="0" x2="70" y2="300" />
              <line x1="250" y1="0" x2="220" y2="300" />
              <line x1="420" y1="0" x2="390" y2="300" />
              <line x1="580" y1="0" x2="550" y2="300" />
              <line x1="740" y1="0" x2="710" y2="300" />
              <line x1="900" y1="0" x2="870" y2="300" />
            </g>
            {/* Moody Neon Teal & Violet Ambient Reflections */}
            <circle cx="220" cy="220" r="140" fill="#0284c7" opacity="0.25" filter="blur(40px)" />
            <circle cx="780" cy="180" r="180" fill="#7c3aed" opacity="0.22" filter="blur(50px)" />
          </svg>
        </div>
      );

    case 'abyssal_navy':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <svg viewBox="0 0 1000 300" className="w-full h-full object-cover opacity-40" fill="none">
            {/* Subtle Deep Space Star Clusters */}
            <circle cx="180" cy="60" r="1.2" fill="#ffffff" opacity="0.8" />
            <circle cx="320" cy="90" r="0.8" fill="#ffffff" opacity="0.5" />
            <circle cx="620" cy="40" r="1.5" fill="#ffffff" opacity="0.7" />
            <circle cx="780" cy="80" r="1" fill="#ffffff" opacity="0.9" />
            <circle cx="880" cy="110" r="0.8" fill="#ffffff" opacity="0.6" />
            {/* Oceanic Indigo Horizon Waves */}
            <path d="M0,190 Q280,120 580,180 T1000,150 L1000,300 L0,300 Z" fill="#1e1b4b" opacity="0.35" />
            <path d="M0,230 Q350,170 700,230 T1000,200 L1000,300 L0,300 Z" fill="#0f172a" opacity="0.4" />
            <circle cx="850" cy="70" r="220" fill="#4338ca" opacity="0.2" filter="blur(45px)" />
          </svg>
        </div>
      );

    case 'velvet_burgundy':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <svg viewBox="0 0 1000 300" className="w-full h-full object-cover opacity-40" fill="none">
            <defs>
              <linearGradient id="burgundy_glow" x1="0" y1="0" x2="1000" y2="300" gradientUnits="userSpaceOnUse">
                <stop stopColor="#881337" stopOpacity="0.35" />
                <stop offset="0.7" stopColor="#4c0519" stopOpacity="0.1" />
                <stop offset="1" stopColor="#000000" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect width="1000" height="300" fill="url(#burgundy_glow)" />
            {/* Minimalist Japanese Curved Seigaiha Waves in dark crimson */}
            <g stroke="#e11d48" strokeWidth="0.8" opacity="0.25" fill="none">
              <path d="M-50,220 Q100,160 250,220 T550,220 T850,220 T1150,220" />
              <path d="M-50,245 Q100,185 250,245 T550,245 T850,245 T1150,245" />
              <path d="M-50,270 Q100,210 250,270 T550,270 T850,270 T1150,270" />
            </g>
            <circle cx="820" cy="90" r="200" fill="#9f1239" opacity="0.25" filter="blur(45px)" />
          </svg>
        </div>
      );

    case 'smoked_sage':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <svg viewBox="0 0 1000 300" className="w-full h-full object-cover opacity-40" fill="none">
            {/* Misty Bamboo Ridge Silhouettes */}
            <path d="M0,210 Q200,140 450,190 T800,160 Q900,170 1000,150 L1000,300 L0,300 Z" fill="#06281e" opacity="0.4" />
            <path d="M0,250 Q300,190 600,240 T1000,210 L1000,300 L0,300 Z" fill="#031610" opacity="0.5" />
            {/* Forest Mist Glow */}
            <circle cx="750" cy="80" r="220" fill="#059669" opacity="0.18" filter="blur(50px)" />
            <circle cx="200" cy="180" r="160" fill="#10b981" opacity="0.15" filter="blur(40px)" />
          </svg>
        </div>
      );

    case 'solar_eclipse':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <svg viewBox="0 0 1000 300" className="w-full h-full object-cover opacity-45" fill="none">
            {/* Dark Moon disk with Golden Corona Ring */}
            <circle cx="820" cy="110" r="110" stroke="#f59e0b" strokeWidth="2.5" opacity="0.6" filter="drop-shadow(0 0 15px #f59e0b)" />
            <circle cx="820" cy="110" r="108" fill="#0d0701" />
            {/* Subtle Horizon Amber Flare */}
            <path d="M0,240 Q400,190 800,210 T1000,190 L1000,300 L0,300 Z" fill="#1c1103" opacity="0.4" />
            <circle cx="820" cy="110" r="220" fill="#d97706" opacity="0.2" filter="blur(45px)" />
          </svg>
        </div>
      );

    case 'vapor_charcoal':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <svg viewBox="0 0 1000 300" className="w-full h-full object-cover opacity-35" fill="none">
            {/* Minimalist Industrial Linear Sheen */}
            <defs>
              <pattern id="brushed_steel" width="12" height="12" patternUnits="userSpaceOnUse">
                <line x1="0" y1="12" x2="12" y2="0" stroke="#94a3b8" strokeWidth="0.5" opacity="0.2" />
              </pattern>
            </defs>
            <rect width="1000" height="300" fill="url(#brushed_steel)" />
            <circle cx="780" cy="90" r="220" fill="#334155" opacity="0.35" filter="blur(40px)" />
            <line x1="100" y1="260" x2="900" y2="40" stroke="#cbd5e1" strokeWidth="0.8" opacity="0.25" />
          </svg>
        </div>
      );

    case 'amethyst_dusk':
    default:
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <svg viewBox="0 0 1000 300" className="w-full h-full object-cover opacity-40" fill="none">
            <circle cx="800" cy="90" r="240" fill="#7c3aed" opacity="0.22" filter="blur(45px)" />
            <circle cx="200" cy="200" r="180" fill="#4c1d95" opacity="0.2" filter="blur(40px)" />
            {/* Elegant Atmospheric Dusk Curves */}
            <path d="M0,200 Q300,120 620,190 T1000,150 L1000,300 L0,300 Z" fill="#1f0a38" opacity="0.35" />
          </svg>
        </div>
      );
  }
};
