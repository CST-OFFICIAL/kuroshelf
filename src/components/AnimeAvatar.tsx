import React from 'react';

export interface AnimeAvatarProps {
  presetId?: string;
  frameColor?: 'rose' | 'cyan' | 'amber' | 'violet' | 'emerald' | 'dragon_gold' | 'astral_sovereign' | 'void_singularity';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isAdmin?: boolean;
  className?: string;
}

export const AnimeAvatar: React.FC<AnimeAvatarProps> = ({
  presetId = 'ronin',
  frameColor = 'rose',
  size = 'md',
  isAdmin = false,
  className = ''
}) => {
  // Size mapping
  const sizeClasses = {
    xs: 'w-7 h-7',
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
    '2xl': 'w-32 h-32 md:w-36 md:h-36'
  }[size];

  // Render the specific vector artwork for the preset
  const renderAvatarIllustration = () => {
    switch (presetId) {
      case 'ronin':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="ronin_bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#e11d48" />
                <stop offset="1" stopColor="#0f0205" />
              </linearGradient>
              <linearGradient id="ronin_blade" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ffffff" />
                <stop offset="0.5" stopColor="#f43f5e" />
                <stop offset="1" stopColor="#881337" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#ronin_bg)" />
            {/* Straw hat brim (Kasa) */}
            <path d="M10 48 Q50 32 90 48 Q50 44 10 48Z" fill="#1c1917" stroke="#fb7185" strokeWidth="1.2" />
            <path d="M25 46 Q50 20 75 46 Z" fill="#292524" />
            {/* Katana hilt & guard at shoulder */}
            <rect x="72" y="24" width="7" height="32" rx="2" transform="rotate(35 72 24)" fill="url(#ronin_blade)" stroke="#fb7185" strokeWidth="1" />
            <circle cx="78" cy="27" r="3" fill="#f43f5e" />
            {/* Shadow Face with Mask */}
            <path d="M35 48 C35 68 50 78 50 78 C50 78 65 68 65 48 Z" fill="#09090b" />
            {/* Crimson Scarf */}
            <path d="M30 68 C35 84 65 84 70 68 C74 76 68 94 50 95 C32 94 26 76 30 68 Z" fill="#e11d48" />
            <path d="M50 78 Q58 88 75 92" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" />
            {/* Glowing Red Eyes through shadow */}
            <ellipse cx="44" cy="54" rx="4.5" ry="2" fill="#fff" />
            <ellipse cx="44" cy="54" rx="2.5" ry="1.2" fill="#f43f5e" />
            <ellipse cx="56" cy="54" rx="4.5" ry="2" fill="#fff" />
            <ellipse cx="56" cy="54" rx="2.5" ry="1.2" fill="#f43f5e" />
            {/* Eye trails / glint */}
            <path d="M40 54 L32 52" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M60 54 L68 52" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" />
            {/* Floating sakura ember */}
            <circle cx="28" cy="30" r="1.5" fill="#fda4af" className="animate-ping" />
          </svg>
        );

      case 'netrunner':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="net_bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#06b6d4" />
                <stop offset="1" stopColor="#020617" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#net_bg)" />
            {/* Cyberpunk grid lines */}
            <line x1="0" y1="80" x2="100" y2="80" stroke="#0891b2" strokeWidth="0.8" opacity="0.4" />
            <line x1="20" y1="100" x2="40" y2="70" stroke="#0891b2" strokeWidth="0.8" opacity="0.4" />
            <line x1="80" y1="100" x2="60" y2="70" stroke="#0891b2" strokeWidth="0.8" opacity="0.4" />
            {/* Cyber Hair Spikes */}
            <path d="M26 34 L38 18 L44 30 L56 14 L62 28 L74 22 L72 44 L28 44 Z" fill="#06b6d4" />
            {/* Face Profile */}
            <path d="M34 38 C34 60 50 72 50 72 C50 72 66 60 66 38 Z" fill="#0f172a" stroke="#06b6d4" strokeWidth="1" />
            {/* Glowing Holographic Visor */}
            <path d="M28 46 L72 46 L70 56 L30 56 Z" fill="#22d3ee" fillOpacity="0.85" />
            <line x1="32" y1="51" x2="68" y2="51" stroke="#ffffff" strokeWidth="1.5" />
            {/* Cybernetic audio jacks / jaw lines */}
            <rect x="25" y="50" width="5" height="12" rx="1.5" fill="#38bdf8" />
            <rect x="70" y="50" width="5" height="12" rx="1.5" fill="#38bdf8" />
            <path d="M44 65 L50 68 L56 65" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" />
            {/* Collar & Jack */}
            <path d="M28 80 L50 95 L72 80 L66 72 L50 82 L34 72 Z" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
          </svg>
        );

      case 'sorcerer':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="sorc_bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#9333ea" />
                <stop offset="1" stopColor="#05020a" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#sorc_bg)" />
            {/* Arcane seal behind */}
            <circle cx="50" cy="50" r="38" stroke="#c084fc" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            <circle cx="50" cy="50" r="28" stroke="#a855f7" strokeWidth="0.8" opacity="0.5" />
            {/* Deep Mystic Hood */}
            <path d="M20 90 Q50 10 80 90 Q65 60 50 65 Q35 60 20 90Z" fill="#1e1035" stroke="#a855f7" strokeWidth="1.5" />
            {/* Dark cowl shadow */}
            <path d="M30 75 Q50 35 70 75 Q50 60 30 75Z" fill="#090212" />
            {/* Mystic Eyes (Dual Amethyst flames) */}
            <ellipse cx="44" cy="55" rx="3.5" ry="2" fill="#f3e8ff" />
            <ellipse cx="44" cy="55" rx="2" ry="1.2" fill="#a855f7" />
            <ellipse cx="56" cy="55" rx="3.5" ry="2" fill="#f3e8ff" />
            <ellipse cx="56" cy="55" rx="2" ry="1.2" fill="#a855f7" />
            {/* Floating Arcane Rune Orb */}
            <circle cx="50" cy="78" r="5" fill="#c084fc" />
            <circle cx="50" cy="78" r="8" stroke="#e9d5ff" strokeWidth="1" opacity="0.7" />
          </svg>
        );

      case 'shonen_flame':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="flame_bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f59e0b" />
                <stop offset="1" stopColor="#450a0a" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#flame_bg)" />
            {/* Wild Spiky Flame Hair */}
            <path d="M20 45 L15 25 L32 30 L38 12 L50 25 L62 8 L66 26 L82 18 L76 42 L88 38 L80 56 L20 56 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1.2" />
            {/* Face */}
            <path d="M32 45 C32 68 50 78 50 78 C50 78 68 68 68 45 Z" fill="#ffedd5" />
            {/* Crimson Headband */}
            <path d="M28 42 L72 42 L70 50 L30 50 Z" fill="#dc2626" />
            <circle cx="50" cy="46" r="3" fill="#ffffff" />
            {/* Intense Shonen Eyes with Spark */}
            <path d="M38 56 Q44 52 48 57" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
            <ellipse cx="43" cy="58" rx="3" ry="3.5" fill="#1f2937" />
            <circle cx="42" cy="56.5" r="1.2" fill="#ffffff" />
            <path d="M62 56 Q56 52 52 57" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
            <ellipse cx="57" cy="58" rx="3" ry="3.5" fill="#1f2937" />
            <circle cx="58" cy="56.5" r="1.2" fill="#ffffff" />
            {/* Fierce smirk */}
            <path d="M46 68 Q50 72 56 68" stroke="#991b1b" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );

      case 'kitsune':
      case 'sakura_blade':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="kitsune_bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f43f5e" />
                <stop offset="1" stopColor="#1f020a" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#kitsune_bg)" />
            {/* Fox Ears */}
            <path d="M28 42 L18 15 L42 28 Z" fill="#ffffff" stroke="#f43f5e" strokeWidth="1.5" />
            <path d="M26 36 L22 22 L36 30 Z" fill="#f43f5e" />
            <path d="M72 42 L82 15 L58 28 Z" fill="#ffffff" stroke="#f43f5e" strokeWidth="1.5" />
            <path d="M74 36 L78 22 L64 30 Z" fill="#f43f5e" />
            {/* Kitsune Ceremonial Mask */}
            <path d="M28 35 C28 65 50 82 50 82 C50 82 72 65 72 35 C72 26 62 26 50 26 C38 26 28 26 28 35 Z" fill="#ffffff" stroke="#e11d48" strokeWidth="1.5" />
            {/* Red Ceremonial Whiskers & Markings */}
            <path d="M38 48 Q32 45 28 47" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" />
            <path d="M38 53 Q30 52 26 55" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" />
            <path d="M62 48 Q68 45 72 47" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" />
            <path d="M62 53 Q70 52 74 55" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" />
            {/* Mask Slit Eyes */}
            <path d="M36 44 Q43 38 47 44" stroke="#be123c" strokeWidth="3" strokeLinecap="round" />
            <path d="M64 44 Q57 38 53 44" stroke="#be123c" strokeWidth="3" strokeLinecap="round" />
            {/* Forehead Sun Mark */}
            <circle cx="50" cy="36" r="3.5" fill="#e11d48" />
            {/* Golden Bells & Tassels */}
            <circle cx="28" cy="72" r="3" fill="#fbbf24" />
            <path d="M28 75 L28 84" stroke="#fbbf24" strokeWidth="2" />
            <circle cx="72" cy="72" r="3" fill="#fbbf24" />
            <path d="M72 75 L72 84" stroke="#fbbf24" strokeWidth="2" />
          </svg>
        );

      case 'mecha_pilot':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="mecha_bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2563eb" />
                <stop offset="1" stopColor="#030712" />
              </linearGradient>
              <linearGradient id="visor_grad" x1="30" y1="40" x2="70" y2="60" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="0.5" stopColor="#818cf8" />
                <stop offset="1" stopColor="#c084fc" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#mecha_bg)" />
            {/* Helmet Outer Shell */}
            <path d="M25 50 C25 22 75 22 75 50 C75 75 68 82 50 82 C32 82 25 75 25 50 Z" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
            {/* Antennae */}
            <path d="M22 35 L12 20" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
            <path d="M78 35 L88 20" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
            {/* Iridescent Full Visor */}
            <path d="M30 40 C30 35 70 35 70 40 C70 65 62 68 50 68 C38 68 30 65 30 40 Z" fill="url(#visor_grad)" />
            {/* HUD Reticle reflection */}
            <circle cx="50" cy="50" r="8" stroke="#ffffff" strokeWidth="1" opacity="0.8" strokeDasharray="2 2" />
            <line x1="44" y1="50" x2="56" y2="50" stroke="#ffffff" strokeWidth="1" opacity="0.8" />
            <line x1="50" y1="44" x2="50" y2="56" stroke="#ffffff" strokeWidth="1" opacity="0.8" />
            {/* Chin Breather */}
            <rect x="42" y="70" width="16" height="6" rx="2" fill="#0f172a" stroke="#60a5fa" strokeWidth="1" />
          </svg>
        );

      case 'abyssal_lord':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="abyss_bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#dc2626" />
                <stop offset="0.4" stopColor="#180306" />
                <stop offset="1" stopColor="#000000" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#abyss_bg)" />
            {/* Demonic Obsidian Horns */}
            <path d="M32 35 C20 18 10 10 5 18 C15 30 25 45 30 50 Z" fill="#09090b" stroke="#ef4444" strokeWidth="1.2" />
            <path d="M68 35 C80 18 90 10 95 18 C85 30 75 45 70 50 Z" fill="#09090b" stroke="#ef4444" strokeWidth="1.2" />
            {/* Dark Monarch Crown */}
            <path d="M35 36 L42 22 L50 30 L58 22 L65 36 Z" fill="#b91c1c" stroke="#fca5a5" strokeWidth="1" />
            <circle cx="50" cy="28" r="2" fill="#fee2e2" />
            {/* Shadow Face */}
            <path d="M32 45 C32 68 50 78 50 78 C50 78 68 68 68 45 Z" fill="#030712" />
            {/* Crimson Glowing Eyes */}
            <polygon points="40,54 48,56 42,59" fill="#ef4444" />
            <polygon points="60,54 52,56 58,59" fill="#ef4444" />
            <circle cx="44" cy="56" r="1.5" fill="#ffffff" />
            <circle cx="56" cy="56" r="1.5" fill="#ffffff" />
            {/* High collar mantle */}
            <path d="M22 75 L35 60 L50 72 L65 60 L78 75 L50 95 Z" fill="#18181b" stroke="#b91c1c" strokeWidth="1.5" />
          </svg>
        );

      case 'starlight_idol':
      case 'alchemist':
      default:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="star_bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#eab308" />
                <stop offset="0.5" stopColor="#a855f7" />
                <stop offset="1" stopColor="#0f172a" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#star_bg)" />
            {/* Twin Tails Hair */}
            <path d="M22 35 C15 55 10 75 25 80 C28 72 26 50 32 45 Z" fill="#c084fc" />
            <path d="M78 35 C85 55 90 75 75 80 C72 72 74 50 68 45 Z" fill="#c084fc" />
            {/* Main Hair & Head */}
            <circle cx="50" cy="46" r="22" fill="#fdf4ff" />
            <path d="M30 38 C30 20 70 20 70 38 C60 36 50 36 30 38 Z" fill="#a855f7" />
            {/* Bangs */}
            <path d="M32 36 L40 46 L46 36 L54 48 L60 36 L68 40 Z" fill="#c084fc" />
            {/* Bright Sparkling Anime Eyes */}
            <ellipse cx="42" cy="48" rx="4" ry="5.5" fill="#7e22ce" />
            <circle cx="43" cy="46" r="2" fill="#ffffff" />
            <circle cx="41" cy="51" r="1" fill="#fbcfe8" />
            <ellipse cx="58" cy="48" rx="4" ry="5.5" fill="#7e22ce" />
            <circle cx="59" cy="46" r="2" fill="#ffffff" />
            <circle cx="57" cy="51" r="1" fill="#fbcfe8" />
            {/* Cheerful Smile */}
            <path d="M47 57 Q50 60 53 57" stroke="#db2777" strokeWidth="1.5" strokeLinecap="round" />
            {/* Starlight Hair Pin */}
            <path d="M66 28 L68 22 L70 28 L76 30 L70 32 L68 38 L66 32 L60 30 Z" fill="#fbbf24" />
          </svg>
        );
    }
  };

  // Render Frame
  const renderFrameOverlays = () => {
    if (frameColor === 'dragon_gold') {
      return (
        <div className="absolute inset-0 pointer-events-none z-20">
          {/* Shimmering Golden Border */}
          <div className="absolute inset-0 rounded-full border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse" />
          {/* Gilded Imperial Crown at Top */}
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
          {/* Dragon Claws grasping bottom */}
          <div className="absolute -bottom-1 left-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2 Q7 9 12 12 M2 6 Q7 10 10 14 M6 2 Q9 8 13 10" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div className="absolute -bottom-1 right-1.5 -scale-x-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2 Q7 9 12 12 M2 6 Q7 10 10 14 M6 2 Q9 8 13 10" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      );
    }

    if (frameColor === 'astral_sovereign') {
      return (
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="absolute inset-0 rounded-full border-2 border-purple-400/80 shadow-[0_0_18px_rgba(168,85,247,0.7)]" />
          {/* Rotating celestial rune ring */}
          <div className="absolute -inset-1.5 rounded-full border border-dashed border-cyan-300/60 animate-[spin_12s_linear_infinite]" />
          {/* Cardinal star gems */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-amber-300 shadow-[0_0_8px_#fde047]" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-amber-300 shadow-[0_0_8px_#fde047]" />
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 rotate-45 bg-cyan-300 shadow-[0_0_8px_#67e8f9]" />
          <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 rotate-45 bg-cyan-300 shadow-[0_0_8px_#67e8f9]" />
        </div>
      );
    }

    if (frameColor === 'void_singularity') {
      return (
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="absolute inset-0 rounded-full border-2 border-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.8)]" />
          <div className="absolute -inset-1 rounded-full border border-red-500/40 animate-pulse" />
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black border border-rose-500/80 text-[8px] font-black text-rose-400 uppercase tracking-widest">
            VOID
          </div>
        </div>
      );
    }

    // Standard frames
    const standardBorders: Record<string, string> = {
      rose: 'border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.35)]',
      cyan: 'border-cyan-400/80 shadow-[0_0_12px_rgba(34,211,238,0.35)]',
      amber: 'border-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.35)]',
      violet: 'border-violet-500/80 shadow-[0_0_12px_rgba(168,85,247,0.35)]',
      emerald: 'border-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.35)]'
    };

    return (
      <div
        className={`absolute inset-0 rounded-full border-2 ${standardBorders[frameColor] || standardBorders.rose} pointer-events-none z-20`}
      />
    );
  };

  return (
    <div className={`relative inline-block select-none ${sizeClasses} ${className}`}>
      {/* Inner Avatar Canvas */}
      <div className="w-full h-full rounded-full overflow-hidden shadow-inner bg-neutral-900 flex items-center justify-center">
        {renderAvatarIllustration()}
      </div>

      {/* Frame overlays */}
      {renderFrameOverlays()}
    </div>
  );
};
