import React from 'react';

export interface AnimeAvatarProps {
  presetId?: string;
  customAvatarUrl?: string | null;
  frameColor?:
    | 'none'
    | 'simple_blurple'
    | 'simple_emerald'
    | 'simple_ruby'
    | 'simple_amber'
    | 'simple_fuchsia'
    | 'simple_cyan'
    | 'dragon_gold'
    | 'shadow_arise'
    | 'infinity_void'
    | 'sun_god_flame'
    | 'susanoo_chakra'
    | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isAdmin?: boolean;
  isDonor?: boolean;
  className?: string;
}

export const AnimeAvatar: React.FC<AnimeAvatarProps> = ({
  presetId = 'noir_ronin',
  customAvatarUrl,
  frameColor = 'none',
  size = 'md',
  isAdmin = false,
  isDonor = false,
  className = ''
}) => {
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [customAvatarUrl]);

  // Size mapping
  const sizeMap: Record<string, { container: string; crown: string; badge: string }> = {
    xs: { container: 'w-7 h-7 text-xs', crown: 'w-3 h-3 -top-2.5', badge: 'text-[9px] -bottom-1' },
    sm: { container: 'w-9 h-9 text-sm', crown: 'w-3.5 h-3.5 -top-3', badge: 'text-[10px] -bottom-1' },
    md: { container: 'w-12 h-12 text-base', crown: 'w-4 h-4 -top-3.5', badge: 'text-xs -bottom-1.5' },
    lg: { container: 'w-16 h-16 text-lg', crown: 'w-5 h-5 -top-4', badge: 'text-xs -bottom-1.5' },
    xl: { container: 'w-24 h-24 text-2xl', crown: 'w-7 h-7 -top-5', badge: 'text-sm -bottom-2' },
    '2xl': { container: 'w-32 h-32 text-3xl', crown: 'w-9 h-9 -top-6', badge: 'text-base -bottom-2.5' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const sizeClasses = currentSize.container;

  // Protect admin-exclusive avatars so normal users can never render them
  const adminOnlyPresets = new Set([
    'kuro_ryu_dragon',
    'shadow_monarch',
    'limitless_awakened',
    'blood_moon_ronin',
    'susanoo_god'
  ]);
  const effectivePresetId = !isAdmin && adminOnlyPresets.has(presetId)
    ? 'curator_cyber_dark'
    : presetId;

  // Render Original Mature Vector Avatars (Curator & Aesthetic Anime/Manga Styles)
  const renderAvatarIllustration = () => {
    switch (effectivePresetId) {
      // ==========================================
      // 1. ORIGINAL MATURE COMMUNITY AVATARS (KURO SHELF CURATOR AESTHETIC)
      // ==========================================
      case 'noir_ronin':
      case 'noir_samurai':
      case 'silly_derp_cat': // legacy fallback
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#09090b" />
            {/* Midnight Rain Strands */}
            <line x1="22" y1="0" x2="12" y2="100" stroke="#38bdf8" strokeWidth="0.8" opacity="0.25" />
            <line x1="62" y1="0" x2="52" y2="100" stroke="#38bdf8" strokeWidth="0.8" opacity="0.25" />
            <line x1="88" y1="0" x2="78" y2="100" stroke="#38bdf8" strokeWidth="0.8" opacity="0.25" />
            {/* Straw Kasa Hat Silhouette */}
            <polygon points="50,14 10,46 90,46" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
            <line x1="50" y1="14" x2="50" y2="46" stroke="#27272a" strokeWidth="1" />
            <line x1="30" y1="30" x2="36" y2="46" stroke="#27272a" strokeWidth="1" />
            <line x1="70" y1="30" x2="64" y2="46" stroke="#27272a" strokeWidth="1" />
            {/* Masked Face Silhouette */}
            <path d="M32 46 L68 46 L60 76 L50 84 L40 76 Z" fill="#09090b" stroke="#27272a" strokeWidth="1.2" />
            {/* Piercing Amber Glow Eyes / Katana Glint */}
            <line x1="36" y1="54" x2="46" y2="54" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" filter="drop-shadow(0 0 6px #f59e0b)" />
            <line x1="54" y1="54" x2="64" y2="54" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" filter="drop-shadow(0 0 6px #f59e0b)" />
            {/* High-Contrast Katana Blade Edge across shoulder */}
            <line x1="14" y1="92" x2="86" y2="68" stroke="#ffffff" strokeWidth="2" filter="drop-shadow(0 0 8px #ffffff)" />
            <line x1="16" y1="94" x2="84" y2="72" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
          </svg>
        );

      case 'cyber_spec_ops':
      case 'cyber_agent':
      case 'silly_confused_duck': // legacy fallback
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#020617" />
            {/* Tactical Grid & Radar Ring */}
            <circle cx="50" cy="50" r="42" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="3 6" opacity="0.35" />
            <circle cx="50" cy="50" r="28" stroke="#0284c7" strokeWidth="0.8" opacity="0.2" />
            {/* Dark Tactical Carbon Composite Helmet */}
            <path d="M26 34 C26 20 38 14 50 14 C62 14 74 20 74 34 L76 64 L50 88 L24 64 Z" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
            {/* Angular Ear Comms Panels */}
            <polygon points="20,44 26,38 26,60 20,54" fill="#1e293b" stroke="#0284c7" strokeWidth="1" />
            <polygon points="80,44 74,38 74,60 80,54" fill="#1e293b" stroke="#0284c7" strokeWidth="1" />
            {/* Horizontal Cyan Laser Visor */}
            <rect x="22" y="44" width="56" height="13" rx="3" fill="#0369a1" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="24" y1="50.5" x2="76" y2="50.5" stroke="#ffffff" strokeWidth="2.5" filter="drop-shadow(0 0 8px #38bdf8)" />
            {/* Small Status Optic LED */}
            <circle cx="30" cy="68" r="1.5" fill="#38bdf8" />
            <line x1="36" y1="68" x2="64" y2="68" stroke="#334155" strokeWidth="1" />
          </svg>
        );

      case 'porcelain_kitsune':
      case 'kitsune_mask':
      case 'silly_toast_runner': // legacy fallback
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#18181b" />
            {/* Fox Ears */}
            <polygon points="24,36 18,10 42,26" fill="#ffffff" stroke="#e11d48" strokeWidth="1.8" />
            <polygon points="24,32 20,16 36,26" fill="#fecdd3" />
            <polygon points="76,36 82,10 58,26" fill="#ffffff" stroke="#e11d48" strokeWidth="1.8" />
            <polygon points="76,32 80,16 64,26" fill="#fecdd3" />
            {/* White Porcelain Mask Face */}
            <path d="M28 36 C28 18 72 18 72 36 C76 56 68 80 50 88 C32 80 24 56 28 36 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
            {/* Crimson Calligraphic Eye Slits */}
            <path d="M32 46 Q42 40 46 48" stroke="#be123c" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            <circle cx="39" cy="46" r="1.5" fill="#e11d48" />
            <path d="M68 46 Q58 40 54 48" stroke="#be123c" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            <circle cx="61" cy="46" r="1.5" fill="#e11d48" />
            {/* Red Whisker Paint Curves */}
            <path d="M30 58 Q38 60 40 68" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M70 58 Q62 60 60 68" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* Nose & Mouth Markings */}
            <circle cx="50" cy="68" r="2.5" fill="#1e293b" />
            <line x1="50" y1="71" x2="50" y2="76" stroke="#1e293b" strokeWidth="1.5" />
            {/* Gold Tassel Accent on Left */}
            <circle cx="22" cy="46" r="3" fill="#f59e0b" />
            <line x1="22" y1="49" x2="20" y2="66" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );

      case 'monochrome_manga':
      case 'silly_smug_hamster': // legacy fallback
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#0f172a" />
            {/* Screentone Dot Matrix Pattern */}
            <defs>
              <pattern id="manga_screentone" width="8" height="8" patternUnits="userSpaceOnUse">
                <circle cx="4" cy="4" r="1.2" fill="#334155" opacity="0.6" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#manga_screentone)" />
            {/* Dynamic Inked Manga Silhouette (Sharp Angles, Shading) */}
            <path d="M20 90 L30 55 L38 58 L32 40 L44 46 L50 20 L58 44 L68 38 L64 56 L72 54 L80 90 Z" fill="#ffffff" />
            <path d="M26 90 L34 60 L40 62 L36 46 L46 50 L50 28 L54 48 L64 44 L60 60 L68 58 L74 90 Z" fill="#09090b" />
            {/* Manga Face Inking */}
            <polygon points="40,52 60,52 50,78" fill="#f8fafc" />
            {/* Piercing Monochrome Eyes */}
            <polygon points="43,58 48,56 46,60" fill="#09090b" />
            <polygon points="57,58 52,56 54,60" fill="#09090b" />
            <line x1="48" y1="68" x2="52" y2="68" stroke="#09090b" strokeWidth="1.5" strokeLinecap="round" />
            {/* Inked Speed Lines */}
            <line x1="10" y1="20" x2="30" y2="28" stroke="#ffffff" strokeWidth="1" opacity="0.5" />
            <line x1="90" y1="20" x2="70" y2="28" stroke="#ffffff" strokeWidth="1" opacity="0.5" />
            <line x1="6" y1="50" x2="22" y2="52" stroke="#ffffff" strokeWidth="1" opacity="0.5" />
            <line x1="94" y1="50" x2="78" y2="52" stroke="#ffffff" strokeWidth="1" opacity="0.5" />
          </svg>
        );

      case 'abyssal_archivist':
      case 'silly_blob_shrug': // legacy fallback
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#060814" />
            {/* Celestial Starfield Background */}
            <circle cx="20" cy="20" r="1" fill="#ffffff" opacity="0.7" />
            <circle cx="80" cy="24" r="1.2" fill="#818cf8" opacity="0.8" />
            <circle cx="75" cy="70" r="0.8" fill="#ffffff" opacity="0.5" />
            <circle cx="25" cy="75" r="1" fill="#c084fc" opacity="0.6" />
            {/* Dark Scholar Hood Silhouette */}
            <path d="M50 14 C32 14 22 28 22 52 C22 74 16 92 16 92 L84 92 C84 92 78 74 78 52 C78 28 68 14 50 14 Z" fill="#0f172a" stroke="#1e293b" strokeWidth="1.8" />
            {/* Deep Shadow Interior */}
            <path d="M50 24 C38 24 30 36 30 52 C30 68 36 78 50 82 C64 78 70 68 70 52 C70 36 62 24 50 24 Z" fill="#020617" />
            {/* Glowing Celestial Sigil / Raven Crest */}
            <polygon points="50,38 53,46 62,47 55,53 58,61 50,56 42,61 45,53 38,47 47,46" fill="#6366f1" filter="drop-shadow(0 0 8px #818cf8)" />
            <circle cx="50" cy="50" r="2" fill="#ffffff" />
            {/* Intricate Magic Circle Ring */}
            <circle cx="50" cy="50" r="16" stroke="#818cf8" strokeWidth="0.8" strokeDasharray="2 4" opacity="0.7" />
          </svg>
        );

      case 'eclipse_zen':
      case 'minimal_lunar':
      case 'silly_popcat': // legacy fallback
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#020617" />
            {/* Radiant Moon Halo */}
            <circle cx="50" cy="50" r="34" stroke="#60a5fa" strokeWidth="1" strokeDasharray="3 6" opacity="0.4" />
            {/* Sharp Geometric Crescent Moon */}
            <path d="M62 22 C44 24 30 38 30 56 C30 70 38 80 48 86 C26 80 16 60 16 42 C16 24 30 12 48 12 C53 12 58 14 62 22 Z" fill="#e0f2fe" filter="drop-shadow(0 0 12px #38bdf8)" />
            {/* Distant Mountain Peak Silhouette */}
            <polygon points="16,92 50,66 84,92" fill="#0f172a" />
            <polygon points="46,92 70,72 94,92" fill="#1e293b" />
            <polygon points="34,92 48,80 62,92" fill="#334155" />
          </svg>
        );

      case 'shadow_shinobi':
      case 'silly_capybara': // legacy fallback
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#090103" />
            {/* Blood-Red Moon Circle in Background */}
            <circle cx="50" cy="46" r="36" fill="#4c0519" opacity="0.6" />
            <circle cx="50" cy="46" r="32" fill="#881337" opacity="0.4" />
            {/* Shinobi Masked Hood Silhouette */}
            <path d="M50 16 C34 16 26 28 26 50 C26 66 32 76 50 82 C68 76 74 66 74 50 C74 28 66 16 50 16 Z" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
            {/* Ninja Face Wrap / Mask */}
            <rect x="30" y="52" width="40" height="24" rx="3" fill="#09090b" />
            {/* Intense Steely Gaze Slit */}
            <line x1="36" y1="46" x2="46" y2="46" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" filter="drop-shadow(0 0 5px #e11d48)" />
            <line x1="54" y1="46" x2="64" y2="46" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" filter="drop-shadow(0 0 5px #e11d48)" />
            {/* Flowing Crimson Long Scarf Tail */}
            <path d="M42 74 Q24 82 12 70 Q16 88 38 84" fill="#e11d48" stroke="#9f1239" strokeWidth="1" />
            <path d="M58 74 Q76 82 88 70 Q84 88 62 84" fill="#e11d48" stroke="#9f1239" strokeWidth="1" />
          </svg>
        );

      case 'mecha_sentinel':
      case 'silly_boba_ghost': // legacy fallback
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#09090b" />
            {/* Tech Hexagon Backdrop */}
            <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" stroke="#475569" strokeWidth="1" fill="#0f172a" opacity="0.6" />
            {/* Mecha Crest V-Fin Antennas */}
            <polygon points="50,28 32,12 36,24 50,34 64,24 68,12" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
            <polygon points="50,34 46,26 50,22 54,26" fill="#ef4444" />
            {/* Armored Helmet & Cheek Guards */}
            <path d="M30 40 L40 34 L60 34 L70 40 L72 64 L50 82 L28 64 Z" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
            {/* Dual Amber Visor Optics */}
            <polygon points="34,50 46,50 44,55 36,55" fill="#fbbf24" filter="drop-shadow(0 0 6px #f59e0b)" />
            <polygon points="66,50 54,50 56,55 64,55" fill="#fbbf24" filter="drop-shadow(0 0 6px #f59e0b)" />
            {/* Lower Chin Intake Vent */}
            <polygon points="46,68 54,68 52,74 48,74" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
            <line x1="44" y1="62" x2="56" y2="62" stroke="#64748b" strokeWidth="1" />
          </svg>
        );

      // ==========================================
      // 3. 5 SOVEREIGN ADMIN EXCLUSIVE AVATARS (MATURE & HIGH-END)
      // ==========================================
      case 'kuro_dragon_emperor':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="emperor_bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#e11d48" />
                <stop offset="0.6" stopColor="#4c0519" />
                <stop offset="1" stopColor="#090103" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#emperor_bg)" />
            {/* Imperial Obsidian Dragon Horns */}
            <path d="M32 30 C20 10 10 2 2 12 C12 25 22 38 28 42 Z" fill="#1c1917" stroke="#f43f5e" strokeWidth="1.5" />
            <path d="M68 30 C80 10 90 2 98 12 C88 25 78 38 72 42 Z" fill="#1c1917" stroke="#f43f5e" strokeWidth="1.5" />
            <path d="M34 46 C34 68 50 78 50 78 C50 78 66 68 66 46 Z" fill="#fff1f2" />
            <path d="M26 44 L18 28 L30 26 L30 14 L42 20 L50 12 L58 20 L70 14 L70 26 L82 28 L74 44 C70 30 60 22 50 22 C40 22 30 30 26 44 Z" fill="#0f172a" stroke="#e11d48" strokeWidth="1" />
            <ellipse cx="43" cy="52" rx="4.5" ry="3" fill="#fbbf24" filter="drop-shadow(0 0 4px #fbbf24)" />
            <line x1="43" y1="49" x2="43" y2="55" stroke="#78350f" strokeWidth="1.5" />
            <ellipse cx="57" cy="52" rx="4.5" ry="3" fill="#fbbf24" filter="drop-shadow(0 0 4px #fbbf24)" />
            <line x1="57" y1="49" x2="57" y2="55" stroke="#78350f" strokeWidth="1.5" />
            <path d="M26 80 L35 70 L50 76 L65 70 L74 80 L50 96 Z" fill="#18040b" stroke="#fbbf24" strokeWidth="1.5" />
            <circle cx="50" cy="85" r="2.5" fill="#f43f5e" />
          </svg>
        );

      case 'shadow_monarch':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="monarch_bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#581c87" />
                <stop offset="0.5" stopColor="#1e1035" />
                <stop offset="1" stopColor="#050014" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#monarch_bg)" />
            <path d="M15 90 Q25 60 10 40 Q25 55 28 80" stroke="#a855f7" strokeWidth="2.5" opacity="0.6" strokeLinecap="round" />
            <path d="M85 90 Q75 60 90 40 Q75 55 72 80" stroke="#a855f7" strokeWidth="2.5" opacity="0.6" strokeLinecap="round" />
            <path d="M22 100 L30 68 L50 82 L70 68 L78 100 Z" fill="#0b0219" stroke="#9333ea" strokeWidth="1.5" />
            <path d="M36 50 C36 68 50 78 50 78 C50 78 64 68 64 50 Z" fill="#181126" stroke="#581c87" strokeWidth="1" />
            <path d="M26 44 L18 28 L32 26 L28 14 L42 20 L50 10 L58 20 L72 14 L68 26 L82 28 L74 44 C70 30 60 22 50 22 C40 22 30 30 26 44 Z" fill="#090117" stroke="#7e22ce" strokeWidth="1" />
            <ellipse cx="43" cy="54" rx="4.5" ry="2" fill="#38bdf8" filter="drop-shadow(0 0 6px #38bdf8)" />
            <ellipse cx="57" cy="54" rx="4.5" ry="2" fill="#38bdf8" filter="drop-shadow(0 0 6px #38bdf8)" />
            <circle cx="43" cy="54" r="1.2" fill="#ffffff" />
            <circle cx="57" cy="54" r="1.2" fill="#ffffff" />
          </svg>
        );

      case 'six_eyes':
      case 'limitless_six_eyes':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="void_avatar_bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0369a1" />
                <stop offset="0.5" stopColor="#082f49" />
                <stop offset="1" stopColor="#020617" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#void_avatar_bg)" />
            <path d="M34 46 C34 68 50 78 50 78 C50 78 66 68 66 46 Z" fill="#f8fafc" />
            {/* Pure Snow-White Spiky Hair */}
            <path d="M24 44 L16 26 L28 24 L26 10 L38 16 L48 8 L58 16 L70 10 L68 24 L80 26 L74 44 C70 30 60 20 50 20 C40 20 30 30 24 44 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
            {/* Black Blindfold Slipped Down */}
            <polygon points="28,40 72,40 70,48 28,48" fill="#0f172a" stroke="#020617" strokeWidth="1" />
            {/* Glowing Crystalline Six-Eyes */}
            <ellipse cx="43" cy="54" rx="5" ry="3" fill="#38bdf8" filter="drop-shadow(0 0 8px #38bdf8)" />
            <circle cx="43" cy="54" r="2" fill="#ffffff" />
            <ellipse cx="57" cy="54" rx="5" ry="3" fill="#38bdf8" filter="drop-shadow(0 0 8px #38bdf8)" />
            <circle cx="57" cy="54" r="2" fill="#ffffff" />
          </svg>
        );

      case 'sun_god_liberation':
      case 'blood_moon_ronin':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="blood_bg" x1="0" y1="0" x2="100" y2="100">
                <stop stopColor="#991b1b" />
                <stop offset="0.6" stopColor="#450a0a" />
                <stop offset="1" stopColor="#0a0000" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#blood_bg)" />
            {/* Giant Blood Moon in background */}
            <circle cx="50" cy="40" r="30" fill="#dc2626" opacity="0.8" filter="drop-shadow(0 0 12px #dc2626)" />
            {/* Ronin Kasa Hat Silhouette */}
            <polygon points="50,22 14,50 86,50" fill="#171717" stroke="#dc2626" strokeWidth="1.5" />
            {/* Mask and Glowing Crimson Eyes */}
            <path d="M36 50 L64 50 L56 74 L50 80 L44 74 Z" fill="#0a0a0a" />
            <line x1="40" y1="58" x2="47" y2="58" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" filter="drop-shadow(0 0 6px #ef4444)" />
            <line x1="53" y1="58" x2="60" y2="58" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" filter="drop-shadow(0 0 6px #ef4444)" />
            {/* Blazing Katana Line */}
            <line x1="10" y1="90" x2="90" y2="60" stroke="#fef08a" strokeWidth="2" filter="drop-shadow(0 0 8px #f97316)" />
          </svg>
        );

      case 'susanoo_god':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="susanoo_bg" x1="0" y1="0" x2="100" y2="100">
                <stop stopColor="#7e22ce" />
                <stop offset="0.6" stopColor="#3b0764" />
                <stop offset="1" stopColor="#090117" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#susanoo_bg)" />
            {/* Tengu Armored Helmet with Spikes */}
            <path d="M24 64 L20 32 L34 16 L50 8 L66 16 L80 32 L76 64 Z" fill="#1e053a" stroke="#c084fc" strokeWidth="2" />
            <path d="M34 16 L20 -2 L38 12 Z" fill="#6b21a8" stroke="#d8b4fe" strokeWidth="1.2" />
            <path d="M66 16 L80 -2 L62 12 Z" fill="#6b21a8" stroke="#d8b4fe" strokeWidth="1.2" />
            <polygon points="50,14 56,22 50,30 44,22" fill="#67e8f9" filter="drop-shadow(0 0 8px #67e8f9)" />
            {/* Tengu Mask Visor Plate */}
            <path d="M30 40 L70 40 L64 68 L50 78 L36 68 Z" fill="#0b0219" stroke="#9333ea" strokeWidth="1.5" />
            {/* Amber God Eyes */}
            <ellipse cx="42" cy="50" rx="6" ry="2.5" fill="#fbbf24" filter="drop-shadow(0 0 8px #fbbf24)" />
            <ellipse cx="58" cy="50" rx="6" ry="2.5" fill="#fbbf24" filter="drop-shadow(0 0 8px #fbbf24)" />
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#18181b" />
            <circle cx="50" cy="42" r="16" fill="#3f3f46" />
            <path d="M22 84 C22 66 34 58 50 58 C66 58 78 66 78 84 Z" fill="#3f3f46" />
          </svg>
        );
    }
  };

  // Render Frame
  const renderFrameOverlays = () => {
    // 1. Exactly 5 Sovereign Admin Exclusive Frames
    if (frameColor === 'dragon_gold') {
      return (
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="absolute inset-0 rounded-full border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse" />
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 drop-shadow-[0_2px_8px_rgba(245,158,11,0.8)]">
            <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
              <path d="M2 18 L6 6 L14 12 L22 6 L26 18 Z" fill="url(#crown_gold)" stroke="#78350f" strokeWidth="1" />
              <circle cx="6" cy="5" r="2" fill="#fef08a" />
              <circle cx="14" cy="10" r="2.5" fill="#ef4444" />
              <circle cx="22" cy="5" r="2" fill="#fef08a" />
              <defs>
                <linearGradient id="crown_gold" x1="2" y1="6" x2="26" y2="18" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#fef08a" />
                  <stop offset="0.5" stopColor="#f59e0b" />
                  <stop offset="1" stopColor="#b45309" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      );
    }

    if (frameColor === 'shadow_arise') {
      return (
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="absolute inset-0 rounded-full border-2 border-purple-500 shadow-[0_0_18px_rgba(168,85,247,0.85)] animate-pulse" />
          <div className="absolute -inset-1 rounded-full border border-indigo-400/50" />
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-purple-950/90 border border-purple-400 text-[7px] font-black text-purple-200 tracking-wider">
            ARISE
          </div>
        </div>
      );
    }

    if (frameColor === 'infinity_void') {
      return (
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="absolute inset-0 rounded-full border-2 border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.8)]" />
          <div className="absolute -inset-1.5 rounded-full border border-dashed border-blue-400/70 animate-[spin_10s_linear_infinite]" />
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-white shadow-[0_0_8px_#38bdf8]" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-white shadow-[0_0_8px_#38bdf8]" />
        </div>
      );
    }

    if (frameColor === 'sun_god_flame') {
      return (
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="absolute inset-0 rounded-full border-2 border-red-500 shadow-[0_0_18px_rgba(239,68,68,0.85)] animate-pulse" />
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 drop-shadow-[0_0_8px_#ef4444]">
            <svg width="22" height="12" viewBox="0 0 22 12" fill="none">
              <path d="M11 0 L14 8 L22 6 L16 11 L11 12 L6 11 L0 6 L8 8 Z" fill="#ef4444" />
              <circle cx="11" cy="7" r="2" fill="#ffffff" />
            </svg>
          </div>
        </div>
      );
    }

    if (frameColor === 'susanoo_chakra') {
      return (
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="absolute inset-0 rounded-full border-2 border-fuchsia-500 shadow-[0_0_18px_rgba(217,70,239,0.8)]" />
          <div className="absolute -inset-1 rounded-full border border-violet-400/40" />
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
            <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
              <polygon points="12,0 16,8 24,4 18,12 12,10 6,12 0,4 8,8" fill="#c084fc" stroke="#f3e8ff" strokeWidth="0.8" />
              <polygon points="12,3 14,7 12,9 10,7" fill="#67e8f9" />
            </svg>
          </div>
        </div>
      );
    }

    // 2. Clean simple frames for regular users
    if (!frameColor || frameColor === 'none') {
      return null;
    }

    const simpleFrames: Record<string, string> = {
      simple_blurple: 'border-[#5865f2] shadow-[0_0_10px_rgba(88,101,242,0.5)]',
      simple_emerald: 'border-[#57f287] shadow-[0_0_10px_rgba(87,242,135,0.5)]',
      simple_ruby: 'border-[#ed4245] shadow-[0_0_10px_rgba(237,66,69,0.5)]',
      simple_amber: 'border-[#fee75c] shadow-[0_0_10px_rgba(254,231,92,0.5)]',
      simple_fuchsia: 'border-[#eb459e] shadow-[0_0_10px_rgba(235,69,158,0.5)]',
      simple_cyan: 'border-[#06b6d4] shadow-[0_0_10px_rgba(6,182,212,0.5)]',
      // Backward compatibility
      rose: 'border-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.35)]',
      cyan: 'border-cyan-400/80 shadow-[0_0_10px_rgba(34,211,238,0.35)]',
      amber: 'border-amber-400/80 shadow-[0_0_10px_rgba(251,191,36,0.35)]',
      violet: 'border-violet-500/80 shadow-[0_0_10px_rgba(168,85,247,0.35)]',
      emerald: 'border-emerald-400/80 shadow-[0_0_10px_rgba(52,211,153,0.35)]'
    };

    const borderStyle = simpleFrames[frameColor];
    if (!borderStyle) return null;

    return (
      <div
        className={`absolute inset-0 rounded-full border-2 ${borderStyle} pointer-events-none z-20`}
      />
    );
  };

  return (
    <div className={`relative inline-block select-none ${sizeClasses} ${className}`}>
      {/* Inner Avatar Canvas */}
      <div className="w-full h-full rounded-full overflow-hidden relative shadow-inner bg-neutral-900 border border-white/10 flex items-center justify-center">
        {customAvatarUrl && !imgError ? (
          <img
            src={customAvatarUrl}
            alt="User avatar"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          renderAvatarIllustration()
        )}
      </div>

      {/* Frame Overlays */}
      {renderFrameOverlays()}

      {/* Admin Crown Badge (Optional overlay for admin accounts) */}
      {isAdmin && (
        <div
          className={`absolute -top-2 -right-1 z-30 flex items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-stone-950 shadow-[0_0_10px_rgba(245,158,11,0.8)] border border-amber-200 ${
            size === '2xl' ? 'w-8 h-8 text-base' : size === 'xl' ? 'w-6 h-6 text-xs' : 'w-4 h-4 text-[10px]'
          }`}
          title="Sovereign Administrator"
        >
          👑
        </div>
      )}

      {/* Supporter / Donator Heart Badge (For users who donate to KuroShelf - separate from membership!) */}
      {isDonor && (
        <div
          className={`absolute -bottom-1 -right-1 z-30 flex items-center justify-center rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.8)] border border-white/40 ${
            size === '2xl' ? 'w-7 h-7 text-xs' : size === 'xl' ? 'w-5 h-5 text-[10px]' : 'w-3.5 h-3.5 text-[8px]'
          }`}
          title="KuroShelf Generous Donator & Supporter ❤️"
        >
          ❤️
        </div>
      )}
    </div>
  );
};
