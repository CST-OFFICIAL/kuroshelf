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
  className?: string;
}

export const AnimeAvatar: React.FC<AnimeAvatarProps> = ({
  presetId = 'silly_derp_cat',
  customAvatarUrl,
  frameColor = 'none',
  size = 'md',
  isAdmin = false,
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

  // Render Original Vector Avatars (Silly, Minimalist Aesthetic, and Sovereign Admin)
  const renderAvatarIllustration = () => {
    switch (presetId) {
      // ==========================================
      // 1. SILLY & FUN COMMUNITY AVATARS
      // ==========================================
      case 'silly_derp_cat':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#fbbf24" />
            {/* Cat Ears */}
            <polygon points="18,40 28,12 44,32" fill="#ea580c" />
            <polygon points="24,36 30,18 40,30" fill="#fbcfe8" />
            <polygon points="82,40 72,12 56,32" fill="#ea580c" />
            <polygon points="76,36 70,18 60,30" fill="#fbcfe8" />
            {/* Round Chubby Cat Face */}
            <ellipse cx="50" cy="56" rx="38" ry="34" fill="#f97316" />
            {/* Goofy Mismatched Derpy Eyes */}
            <circle cx="36" cy="48" r="10" fill="#ffffff" stroke="#7c2d12" strokeWidth="2" />
            <circle cx="34" cy="46" r="4.5" fill="#18181b" />
            <circle cx="64" cy="50" r="12" fill="#ffffff" stroke="#7c2d12" strokeWidth="2" />
            <circle cx="66" cy="52" r="4" fill="#18181b" />
            {/* Pink Nose */}
            <polygon points="50,60 46,56 54,56" fill="#f43f5e" />
            {/* Whiskers */}
            <line x1="16" y1="58" x2="30" y2="60" stroke="#7c2d12" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="14" y1="66" x2="30" y2="65" stroke="#7c2d12" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="84" y1="58" x2="70" y2="60" stroke="#7c2d12" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="86" y1="66" x2="70" y2="65" stroke="#7c2d12" strokeWidth="1.8" strokeLinecap="round" />
            {/* Mouth with Pink Tongue Out (Blep) */}
            <path d="M42 64 Q50 67 50 64 Q50 67 58 64" stroke="#7c2d12" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M46 65 C46 76 54 76 54 65 Z" fill="#f43f5e" stroke="#9f1239" strokeWidth="1.2" />
            <line x1="50" y1="66" x2="50" y2="72" stroke="#be123c" strokeWidth="1" />
          </svg>
        );

      case 'silly_confused_duck':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#38bdf8" />
            {/* Duck Body & Tilted Head */}
            <g transform="rotate(-8 50 50)">
              <ellipse cx="50" cy="58" rx="34" ry="32" fill="#fde047" stroke="#ca8a04" strokeWidth="2" />
              {/* Feathery Tuft on Head */}
              <path d="M48 26 C46 16 52 14 54 22 C56 14 62 16 58 26" stroke="#ca8a04" strokeWidth="2.5" fill="#fde047" strokeLinecap="round" />
              {/* Big Goofy Cartoon Eyes */}
              <ellipse cx="38" cy="46" rx="8" ry="10" fill="#ffffff" stroke="#713f12" strokeWidth="2" />
              <circle cx="39" cy="46" r="3.5" fill="#09090b" />
              <ellipse cx="62" cy="46" rx="8" ry="10" fill="#ffffff" stroke="#713f12" strokeWidth="2" />
              <circle cx="61" cy="48" r="3.5" fill="#09090b" />
              {/* Giant Clumsy Orange Beak */}
              <ellipse cx="50" cy="64" rx="22" ry="12" fill="#fb923c" stroke="#c2410c" strokeWidth="2" />
              <circle cx="45" cy="62" r="1.5" fill="#9a3412" />
              <circle cx="55" cy="62" r="1.5" fill="#9a3412" />
              <path d="M34 65 Q50 71 66 65" stroke="#c2410c" strokeWidth="1.8" fill="none" />
              {/* Rosy Cheeks */}
              <ellipse cx="24" cy="56" rx="5" ry="3" fill="#f43f5e" opacity="0.6" />
              <ellipse cx="76" cy="56" rx="5" ry="3" fill="#f43f5e" opacity="0.6" />
            </g>
            {/* Floating Confused Question Mark */}
            <g transform="translate(74, 12)">
              <text x="0" y="22" fill="#ffffff" fontSize="26" fontWeight="900" fontFamily="sans-serif" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))">?</text>
            </g>
          </svg>
        );

      case 'silly_toast_runner':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#818cf8" />
            {/* Running Wind Action Lines */}
            <line x1="8" y1="20" x2="28" y2="20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            <line x1="4" y1="50" x2="20" y2="50" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            <line x1="10" y1="80" x2="26" y2="80" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            {/* Face */}
            <circle cx="56" cy="50" r="32" fill="#ffedd5" stroke="#ea580c" strokeWidth="1.5" />
            {/* Messy Running Hair with Ahoge Tuft */}
            <path d="M26 40 C30 18 68 14 84 36 C80 20 62 16 52 14 C48 4 44 8 46 16 C34 20 28 30 26 40 Z" fill="#475569" />
            <path d="M50 14 Q52 2 46 4 Q44 10 48 14" stroke="#475569" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Panicked Dizzy Spiral Eyes */}
            <g transform="translate(42, 42)">
              <circle cx="0" cy="0" r="7" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" />
              <path d="M-3 -1 Q0 -4 3 -1 Q4 3 0 3 Q-2 1 0 0" stroke="#1e293b" strokeWidth="1.2" fill="none" />
            </g>
            <g transform="translate(68, 42)">
              <circle cx="0" cy="0" r="7" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" />
              <path d="M-3 -1 Q0 -4 3 -1 Q4 3 0 3 Q-2 1 0 0" stroke="#1e293b" strokeWidth="1.2" fill="none" />
            </g>
            {/* Sweat Drop on forehead */}
            <path d="M78 28 C78 24 82 20 82 20 C82 20 86 24 86 28 C86 31 82 33 78 28 Z" fill="#38bdf8" />
            {/* Giant Slice of Toast Clamped Sideways in Mouth */}
            <g transform="translate(35, 54) rotate(-6)">
              {/* Toast Bread Outline */}
              <rect x="0" y="0" width="46" height="24" rx="4" fill="#fed7aa" stroke="#b45309" strokeWidth="2" />
              <path d="M0 4 C10 -4 36 -4 46 4" stroke="#b45309" strokeWidth="2" fill="#fed7aa" />
              {/* Melting Butter Square */}
              <rect x="18" y="6" width="10" height="10" rx="1.5" fill="#fde047" stroke="#ca8a04" strokeWidth="1" />
              {/* Bite Crumb Indent */}
              <circle cx="23" cy="18" r="3" fill="#ffedd5" />
            </g>
          </svg>
        );

      case 'silly_smug_hamster':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#f97316" />
            {/* Tiny Round Hamster Ears */}
            <circle cx="24" cy="28" r="10" fill="#ea580c" />
            <circle cx="24" cy="28" r="6" fill="#fbcfe8" />
            <circle cx="76" cy="28" r="10" fill="#ea580c" />
            <circle cx="76" cy="28" r="6" fill="#fbcfe8" />
            {/* Hamster Body with Huge Puffed Chubby Cheeks */}
            <ellipse cx="50" cy="60" rx="40" ry="32" fill="#fed7aa" stroke="#c2410c" strokeWidth="2" />
            {/* Left Cheek */}
            <circle cx="25" cy="62" r="15" fill="#ffedd5" />
            <circle cx="75" cy="62" r="15" fill="#ffedd5" />
            {/* Smug Half-Closed Squint Eyes */}
            <path d="M30 46 Q40 40 44 48" stroke="#431407" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M70 46 Q60 40 56 48" stroke="#431407" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Cute Smug Eyebrows */}
            <path d="M30 38 L42 42" stroke="#7c2d12" strokeWidth="2" strokeLinecap="round" />
            <path d="M70 38 L58 42" stroke="#7c2d12" strokeWidth="2" strokeLinecap="round" />
            {/* Tiny Nose */}
            <polygon points="50,54 47,51 53,51" fill="#f43f5e" />
            {/* Cheeky Asymmetric Smug Smile */}
            <path d="M46 58 Q52 64 64 56" stroke="#431407" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Whiskers */}
            <line x1="12" y1="62" x2="22" y2="62" stroke="#78350f" strokeWidth="1.5" />
            <line x1="14" y1="68" x2="22" y2="66" stroke="#78350f" strokeWidth="1.5" />
            <line x1="88" y1="62" x2="78" y2="62" stroke="#78350f" strokeWidth="1.5" />
            <line x1="86" y1="68" x2="78" y2="66" stroke="#78350f" strokeWidth="1.5" />
            {/* Holding Sunflower Seed */}
            <ellipse cx="50" cy="78" rx="8" ry="12" fill="#292524" stroke="#78716c" strokeWidth="1.5" />
            <line x1="50" y1="68" x2="50" y2="88" stroke="#a8a29e" strokeWidth="1" />
          </svg>
        );

      case 'silly_blob_shrug':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#14b8a6" />
            {/* Marshmallow Jelly Blob Body */}
            <path
              d="M24 76 C14 74 16 48 30 40 C40 32 60 32 70 40 C84 48 86 74 76 76 C66 78 34 78 24 76 Z"
              fill="#ccfbf1"
              stroke="#0f766e"
              strokeWidth="2.5"
            />
            {/* Shrugging Hands (Up in the Air) */}
            <path d="M18 52 L8 40 L16 38" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M82 52 L92 40 L84 38" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {/* Cute Dot Eyes */}
            <circle cx="40" cy="50" r="4" fill="#134e4a" />
            <circle cx="41" cy="49" r="1.5" fill="#ffffff" />
            <circle cx="60" cy="50" r="4" fill="#134e4a" />
            <circle cx="61" cy="49" r="1.5" fill="#ffffff" />
            {/* Shrug Cat-like Open Mouth */}
            <path d="M46 58 Q50 62 54 58" stroke="#134e4a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            {/* Rosy Blush */}
            <ellipse cx="32" cy="55" rx="4" ry="2" fill="#f43f5e" opacity="0.5" />
            <ellipse cx="68" cy="55" rx="4" ry="2" fill="#f43f5e" opacity="0.5" />
          </svg>
        );

      case 'silly_popcat':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#f43f5e" />
            {/* Cat Ears */}
            <polygon points="18,36 28,10 46,26" fill="#fecdd3" stroke="#881337" strokeWidth="2" />
            <polygon points="82,36 72,10 54,26" fill="#fecdd3" stroke="#881337" strokeWidth="2" />
            {/* Cat Head */}
            <ellipse cx="50" cy="56" rx="38" ry="34" fill="#ffe4e6" stroke="#881337" strokeWidth="2" />
            {/* Big Black Anime Eyes */}
            <circle cx="36" cy="42" r="8" fill="#1c1917" />
            <circle cx="38" cy="40" r="3" fill="#ffffff" />
            <circle cx="64" cy="42" r="8" fill="#1c1917" />
            <circle cx="66" cy="40" r="3" fill="#ffffff" />
            {/* Iconic Giant Open Circular POPCAT Mouth */}
            <ellipse cx="50" cy="68" rx="18" ry="16" fill="#881337" stroke="#4c0519" strokeWidth="2.5" />
            <ellipse cx="50" cy="74" rx="12" ry="7" fill="#f43f5e" />
          </svg>
        );

      case 'silly_capybara':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#78350f" />
            {/* Capybara Snout & Square Head */}
            <path
              d="M26 78 C24 50 30 38 46 36 L72 36 C84 38 88 56 86 78 Z"
              fill="#b45309"
              stroke="#451a03"
              strokeWidth="2"
            />
            {/* Ears */}
            <ellipse cx="32" cy="38" rx="6" ry="4" fill="#78350f" />
            {/* Relaxed Zen Half-Closed Slit Eyes */}
            <line x1="42" y1="48" x2="52" y2="48" stroke="#1c1917" strokeWidth="2.5" strokeLinecap="round" />
            {/* Flat Nose & Whiskers */}
            <ellipse cx="78" cy="66" rx="6" ry="4" fill="#451a03" />
            <line x1="78" y1="70" x2="78" y2="76" stroke="#451a03" strokeWidth="2" />
            {/* Yuzu / Orange on Head */}
            <circle cx="58" cy="24" r="12" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
            <ellipse cx="58" cy="14" rx="2" ry="4" fill="#65a30d" />
            <circle cx="60" cy="22" r="1.5" fill="#fef08a" />
            {/* Hot Spring Water Waves */}
            <path d="M0 86 Q25 80 50 86 T100 86 L100 100 L0 100 Z" fill="#0284c7" opacity="0.8" />
          </svg>
        );

      case 'silly_boba_ghost':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#6366f1" />
            {/* Bedsheet Ghost Body */}
            <path
              d="M50 16 C30 16 22 34 22 62 L22 80 Q28 72 34 80 Q42 72 50 80 Q58 72 66 80 Q72 72 78 80 L78 62 C78 34 70 16 50 16 Z"
              fill="#ffffff"
              stroke="#4338ca"
              strokeWidth="2"
            />
            {/* Cute Wide Happy Eyes */}
            <ellipse cx="40" cy="40" rx="4.5" ry="6" fill="#1e1b4b" />
            <circle cx="41" cy="38" r="2" fill="#ffffff" />
            <ellipse cx="60" cy="40" rx="4.5" ry="6" fill="#1e1b4b" />
            <circle cx="61" cy="38" r="2" fill="#ffffff" />
            {/* Cute Little Boba Milk Tea Cup in Hands */}
            <g transform="translate(40, 48)">
              {/* Cup */}
              <path d="M2 6 L18 6 L15 26 L5 26 Z" fill="#fed7aa" stroke="#78350f" strokeWidth="1.5" />
              {/* Fat Straw */}
              <line x1="10" y1="0" x2="10" y2="24" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" />
              {/* Boba Tapioca Pearls at bottom */}
              <circle cx="7" cy="22" r="2" fill="#1c1917" />
              <circle cx="11" cy="23" r="2" fill="#1c1917" />
              <circle cx="13" cy="21" r="2" fill="#1c1917" />
            </g>
          </svg>
        );

      // ==========================================
      // 2. CLEAN AESTHETIC & MINIMALIST AVATARS
      // ==========================================
      case 'noir_samurai':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#09090b" />
            {/* Midnight Rain Strands */}
            <line x1="20" y1="0" x2="10" y2="100" stroke="#38bdf8" strokeWidth="0.8" opacity="0.3" />
            <line x1="60" y1="0" x2="50" y2="100" stroke="#38bdf8" strokeWidth="0.8" opacity="0.3" />
            <line x1="90" y1="0" x2="80" y2="100" stroke="#38bdf8" strokeWidth="0.8" opacity="0.3" />
            {/* Straw Kasa Hat Silhouette */}
            <polygon points="50,18 12,48 88,48" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
            <line x1="50" y1="18" x2="50" y2="48" stroke="#27272a" strokeWidth="1" />
            {/* Masked Face with Piercing Amber Glow Slit */}
            <path d="M34 48 L66 48 L58 74 L50 82 L42 74 Z" fill="#09090b" stroke="#27272a" strokeWidth="1" />
            <line x1="38" y1="56" x2="48" y2="56" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" filter="drop-shadow(0 0 6px #f59e0b)" />
            <line x1="52" y1="56" x2="62" y2="56" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" filter="drop-shadow(0 0 6px #f59e0b)" />
            {/* Katana Blade Edge across shoulder */}
            <line x1="16" y1="92" x2="84" y2="70" stroke="#ffffff" strokeWidth="2" filter="drop-shadow(0 0 8px #ffffff)" />
          </svg>
        );

      case 'cyber_agent':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#030712" />
            {/* Futuristic Grid lines */}
            <circle cx="50" cy="50" r="42" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="4 6" opacity="0.3" />
            {/* Dark Tactical Helmet/Visor Silhouette */}
            <path d="M28 32 C28 20 40 16 50 16 C60 16 72 20 72 32 L74 62 L50 86 L26 62 Z" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
            {/* Horizontal Cyan Laser Visor */}
            <rect x="24" y="44" width="52" height="12" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="26" y1="50" x2="74" y2="50" stroke="#ffffff" strokeWidth="2.5" filter="drop-shadow(0 0 8px #38bdf8)" />
          </svg>
        );

      case 'kitsune_mask':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#18181b" />
            {/* Fox Ears */}
            <polygon points="26,38 20,12 42,28" fill="#ffffff" stroke="#e11d48" strokeWidth="1.5" />
            <polygon points="74,38 80,12 58,28" fill="#ffffff" stroke="#e11d48" strokeWidth="1.5" />
            {/* White Porcelain Mask Face */}
            <path d="M30 36 C30 20 70 20 70 36 C74 54 66 78 50 86 C34 78 26 54 30 36 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
            {/* Crimson Eye Markings */}
            <path d="M34 46 Q42 42 46 48" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M66 46 Q58 42 54 48" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Whisker Paint Curves */}
            <path d="M32 58 Q40 60 42 66" stroke="#e11d48" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M68 58 Q60 60 58 66" stroke="#e11d48" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <circle cx="50" cy="68" r="2.5" fill="#1e293b" />
          </svg>
        );

      case 'minimal_lunar':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#020617" />
            {/* Radiant Moon Halo */}
            <circle cx="50" cy="50" r="32" stroke="#60a5fa" strokeWidth="1" strokeDasharray="3 6" opacity="0.5" />
            {/* Sharp Geometric Crescent Moon */}
            <path d="M62 24 C44 26 32 40 32 58 C32 70 38 78 46 84 C26 78 16 60 16 44 C16 26 30 14 48 14 C53 14 58 16 62 24 Z" fill="#e0f2fe" filter="drop-shadow(0 0 10px #38bdf8)" />
            {/* Distant Mountain Peak Silhouette */}
            <polygon points="20,90 50,68 80,90" fill="#0f172a" />
            <polygon points="50,90 70,74 90,90" fill="#1e293b" />
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
    </div>
  );
};
