import React, { useState } from 'react';

interface AdminDragonBannerProps {
  themeId?: string; // 'domain_expansion' | 'shadow_monarch' | 'bankai_flame' | 'susanoo_citadel' | 'kuro_sovereign'
  interactive?: boolean;
}

export const AdminDragonBanner: React.FC<AdminDragonBannerProps> = ({
  themeId = 'domain_expansion',
}) => {
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  // Determine which of the 5 sovereign admin themes is active
  const isDomain = themeId === 'domain_expansion';
  const isShadow = themeId === 'shadow_monarch';
  const isBankai = themeId === 'bankai_flame';
  const isSusanoo = themeId === 'susanoo_citadel';
  // Default/Fallback is Kuro Dragon
  const isDragon = !isDomain && !isShadow && !isBankai && !isSusanoo;

  // Theme primary colors for interactive cursor spotlight
  const spotlightColor = isDomain
    ? '#38bdf8'
    : isShadow
    ? '#a855f7'
    : isBankai
    ? '#f97316'
    : isSusanoo
    ? '#c084fc'
    : '#e11d48';

  const watermarkText = isDomain
    ? '無量'
    : isShadow
    ? '君主'
    : isBankai
    ? '残火'
    : isSusanoo
    ? '天狗'
    : '黒竜';

  const sealTitle = isDomain
    ? '無量空処'
    : isShadow
    ? '影の君主'
    : isBankai
    ? '残火の太刀'
    : isSusanoo
    ? '須佐能乎'
    : '黒竜皇室';

  const sealSubtitle = isDomain
    ? 'INFINITE VOID'
    : isShadow
    ? 'SHADOW MONARCH'
    : isBankai
    ? 'ZANKA NO TACHI'
    : isSusanoo
    ? 'PERFECT SUSANOO'
    : 'SOVEREIGN ADMIN';

  const sealBorderClass = isDomain
    ? 'bg-sky-950/80 border-sky-400/70 text-sky-200 shadow-sky-950/60'
    : isShadow
    ? 'bg-purple-950/80 border-purple-400/70 text-purple-200 shadow-purple-950/60'
    : isBankai
    ? 'bg-amber-950/80 border-orange-500/70 text-orange-200 shadow-orange-950/60'
    : isSusanoo
    ? 'bg-indigo-950/80 border-indigo-400/70 text-indigo-200 shadow-indigo-950/60'
    : 'bg-rose-950/80 border-rose-500/70 text-rose-200 shadow-rose-950/60';

  const stampColorClass = isDomain
    ? 'bg-sky-600/40 border-sky-400 text-sky-200'
    : isShadow
    ? 'bg-purple-600/40 border-purple-400 text-purple-200'
    : isBankai
    ? 'bg-orange-600/40 border-orange-400 text-orange-200'
    : isSusanoo
    ? 'bg-indigo-600/40 border-indigo-400 text-indigo-200'
    : 'bg-rose-600/40 border-rose-400 text-rose-200';

  return (
    <div
      onMouseMove={handleMouseMove}
      className="absolute -top-10 sm:-top-16 bottom-0 -left-4 -right-4 pointer-events-none overflow-hidden sm:overflow-visible z-10 select-none"
    >
      {/* Interactive Cursor Spotlight Glow */}
      <div
        className="absolute w-80 h-80 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-opacity duration-300 opacity-30 blur-3xl"
        style={{
          left: `${mousePos.x}%`,
          top: `${mousePos.y}%`,
          background: `radial-gradient(circle, ${spotlightColor} 0%, transparent 70%)`,
        }}
      />

      {/* Dynamic Background Imperial Watermark */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 text-8xl md:text-9xl font-black text-white/[0.04] font-serif tracking-widest pointer-events-none select-none">
        {watermarkText}
      </div>

      {/* Sovereign Seal Stamp in Top Right - Frameless Authentic Floating Seal */}
      <div className="absolute top-8 sm:top-6 right-6 z-20 pointer-events-none flex items-center gap-2">
        <div className={`px-3 py-1.5 rounded-xl flex items-center gap-2 backdrop-blur-md shadow-2xl transition-all duration-300 ${sealBorderClass}`}>
          {/* Hanko Square Stamp */}
          <div className={`w-6 h-6 rounded flex items-center justify-center font-serif text-[10px] font-bold shadow-inner ${stampColorClass}`}>
            印
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-black tracking-widest leading-none uppercase">{sealTitle}</span>
            <span className="text-[8px] font-mono tracking-wider opacity-75">{sealSubtitle}</span>
          </div>
        </div>
      </div>

      {/* Ambient Gradient Shading */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

      {/* 1. DOMAIN EXPANSION: INFINITE VOID */}
      {isDomain && (
        <svg
          viewBox="0 -80 1000 450"
          className="w-full h-full object-cover overflow-visible drop-shadow-[0_20px_45px_rgba(0,0,0,0.95)] pointer-events-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="void_core_glow" cx="65%" cy="45%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="25%" stopColor="#6366f1" stopOpacity="0.6" />
              <stop offset="60%" stopColor="#0f172a" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="shatter_grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Celestial Cosmic Nebula Base */}
          <ellipse cx="650" cy="140" rx="360" ry="190" fill="url(#void_core_glow)" />

          {/* Concentric Infinity Orbital Rings breaking out */}
          <circle cx="650" cy="140" r="150" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="4 8" opacity="0.7" />
          <circle cx="650" cy="140" r="210" stroke="#818cf8" strokeWidth="1.2" strokeDasharray="2 12" opacity="0.6" />
          <circle cx="650" cy="140" r="270" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="8 16" opacity="0.4" />

          {/* Central Black Hole Singularity with Glowing Accretion Horizon */}
          <circle cx="650" cy="140" r="65" fill="#020617" />
          <circle cx="650" cy="140" r="72" stroke="#38bdf8" strokeWidth="3.5" opacity="0.95" filter="drop-shadow(0 0 18px #38bdf8)" />
          <circle cx="650" cy="140" r="78" stroke="#ffffff" strokeWidth="1.5" opacity="0.85" />

          {/* Inverted Accretion Jet Rays shooting out of the frame */}
          <path d="M650 -45 L650 340" stroke="#38bdf8" strokeWidth="2" opacity="0.5" />
          <path d="M500 140 L800 140" stroke="#38bdf8" strokeWidth="2" opacity="0.5" />
          <path d="M530 -30 L770 310" stroke="#818cf8" strokeWidth="1.5" opacity="0.4" strokeDasharray="4 4" />
          <path d="M530 310 L770 -30" stroke="#818cf8" strokeWidth="1.5" opacity="0.4" strokeDasharray="4 4" />

          {/* Dimensional Glass Fracture Shards Popping Above the Top Banner Frame */}
          <polygon points="120,-30 290,-45 250,70 80,40" fill="url(#shatter_grad)" stroke="#38bdf8" strokeWidth="1.5" opacity="0.8" />
          <polygon points="270,75 400,30 350,160 210,120" fill="url(#shatter_grad)" stroke="#60a5fa" strokeWidth="1.2" opacity="0.7" />
          <polygon points="130,160 250,210 190,320 60,250" fill="url(#shatter_grad)" stroke="#818cf8" strokeWidth="1" opacity="0.6" />
          <polygon points="340,160 480,130 440,270 300,220" fill="url(#shatter_grad)" stroke="#38bdf8" strokeWidth="1.2" opacity="0.7" />

          {/* Sacred Hand Mudra Silhouette: Gojo's Infinite Void crossed fingers BURSTING OUT OF TOP */}
          <g transform="translate(180, 20) scale(1.0)" opacity="0.95">
            <path
              d="M120 220 C110 170 120 100 135 45 C140 25 155 20 160 40 C165 65 165 115 165 145 C175 95 185 55 195 30 C202 15 215 20 215 40 C215 75 205 135 200 175 C210 145 225 105 235 85 C242 73 255 80 250 100 C240 135 225 185 210 225 C180 265 140 255 120 220 Z"
              fill="#030712"
              stroke="#38bdf8"
              strokeWidth="3"
              filter="drop-shadow(0 0 12px #38bdf8)"
            />
            {/* Glowing Hand Seal Rune Lines */}
            <path d="M150 75 L150 155" stroke="#bae6fd" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M190 65 L185 145" stroke="#bae6fd" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="160" cy="40" r="4.5" fill="#ffffff" filter="drop-shadow(0 0 10px #38bdf8)" />
            <circle cx="205" cy="30" r="4.5" fill="#ffffff" filter="drop-shadow(0 0 10px #38bdf8)" />
          </g>

          {/* Floating Infinite Space Stardust */}
          <circle cx="450" cy="30" r="2.5" fill="#ffffff" opacity="0.95" />
          <circle cx="520" cy="70" r="2" fill="#38bdf8" opacity="0.9" />
          <circle cx="820" cy="40" r="3" fill="#ffffff" opacity="0.95" />
          <circle cx="890" cy="100" r="2" fill="#bae6fd" opacity="0.8" />
          <circle cx="780" cy="270" r="2.5" fill="#818cf8" opacity="0.85" />
          <circle cx="610" cy="310" r="2" fill="#38bdf8" opacity="0.9" />
        </svg>
      )}

      {/* 2. SHADOW MONARCH: ARISE OF THE ABYSSAL ARMY */}
      {isShadow && (
        <svg
          viewBox="0 -80 1000 450"
          className="w-full h-full object-cover overflow-visible drop-shadow-[0_20px_45px_rgba(0,0,0,0.95)] pointer-events-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="shadow_mist_grad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#7e22ce" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#3b0764" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#090014" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="monarch_armor" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2e1065" />
              <stop offset="50%" stopColor="#090117" />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>
          </defs>

          {/* Rolling Necrotic Shadow Mist along bottom spilling out */}
          <path
            d="M0 370 L0 240 Q120 200 250 230 Q380 260 500 210 Q650 160 800 220 Q900 250 1000 200 L1000 370 Z"
            fill="url(#shadow_mist_grad)"
          />

          {/* Shadow Monarch's Colossal Obsidian Throne Spire REACHING PAST THE TOP FRAME */}
          <g transform="translate(680, 20)" opacity="0.95">
            {/* Spire Backrest extending past top */}
            <path
              d="M-55 250 L-35 50 L-12 80 L0 -45 L12 80 L35 50 L55 250 Z"
              fill="url(#monarch_armor)"
              stroke="#c084fc"
              strokeWidth="2"
              filter="drop-shadow(0 0 15px #7e22ce)"
            />
            {/* Jagged Throne Wings */}
            <path d="M-85 190 L-45 100 L-55 210 Z" fill="#0b021c" stroke="#a855f7" strokeWidth="1.5" />
            <path d="M85 190 L45 100 L55 210 Z" fill="#0b021c" stroke="#a855f7" strokeWidth="1.5" />
            {/* Throne Crest Eye Gem */}
            <circle cx="0" cy="50" r="7" fill="#38bdf8" filter="drop-shadow(0 0 12px #38bdf8)" />
          </g>

          {/* Soldier 1: Shadow Knight Captain with Plume BURSTING OUT OF TOP */}
          <g transform="translate(180, 80)">
            <path
              d="M30 180 L20 80 L40 30 L50 10 L60 30 L80 80 L70 180 Z"
              fill="url(#monarch_armor)"
              stroke="#a855f7"
              strokeWidth="2"
            />
            {/* Flowing Red/Violet Plume soaring out above the banner */}
            <path d="M50 10 Q80 -45 110 -25 Q135 0 105 50" stroke="#f43f5e" strokeWidth="5" strokeLinecap="round" opacity="0.9" filter="drop-shadow(0 0 8px #f43f5e)" />
            {/* Knight Broadsword Blade Point reaching out over top */}
            <line x1="85" y1="-30" x2="85" y2="190" stroke="#c084fc" strokeWidth="3.5" filter="drop-shadow(0 0 8px #c084fc)" />
            <line x1="75" y1="25" x2="95" y2="25" stroke="#a855f7" strokeWidth="4.5" />
            {/* Piercing Glowing Slit Eyes */}
            <ellipse cx="43" cy="52" rx="4.5" ry="2" fill="#38bdf8" filter="drop-shadow(0 0 8px #38bdf8)" />
            <ellipse cx="57" cy="52" rx="4.5" ry="2" fill="#38bdf8" filter="drop-shadow(0 0 8px #38bdf8)" />
          </g>

          {/* Soldier 2: Shadow Mage Staff floating orb */}
          <g transform="translate(390, 140)" opacity="0.9">
            <path d="M20 160 L35 70 L50 45 L65 70 L80 160 Z" fill="#070014" stroke="#9333ea" strokeWidth="1.8" />
            <line x1="15" y1="10" x2="15" y2="160" stroke="#a855f7" strokeWidth="2.5" />
            <circle cx="15" cy="10" r="10" fill="#c084fc" filter="drop-shadow(0 0 14px #c084fc)" />
            <ellipse cx="44" cy="65" rx="3.5" ry="1.5" fill="#22d3ee" filter="drop-shadow(0 0 6px #22d3ee)" />
            <ellipse cx="56" cy="65" rx="3.5" ry="1.5" fill="#22d3ee" filter="drop-shadow(0 0 6px #22d3ee)" />
          </g>

          {/* Rising Shadow Smoke Tendrils surging high above banner */}
          <path d="M120 280 Q150 100 130 -30" stroke="#9333ea" strokeWidth="3.5" opacity="0.75" strokeLinecap="round" />
          <path d="M320 300 Q290 120 310 -20" stroke="#a855f7" strokeWidth="3" opacity="0.65" strokeLinecap="round" />
          <path d="M850 310 Q880 130 860 -15" stroke="#c084fc" strokeWidth="3" opacity="0.7" strokeLinecap="round" />
        </svg>
      )}

      {/* 3. BANKAI: ZANKA NO TACHI (SCORCHED SUN HELL) */}
      {isBankai && (
        <svg
          viewBox="0 -80 1000 450"
          className="w-full h-full object-cover overflow-visible drop-shadow-[0_20px_45px_rgba(0,0,0,0.95)] pointer-events-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="sun_core_grad" cx="50%" cy="30%" r="50%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="30%" stopColor="#f97316" />
              <stop offset="60%" stopColor="#dc2626" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="blade_charred" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="20%" stopColor="#fed7aa" />
              <stop offset="40%" stopColor="#f97316" />
              <stop offset="70%" stopColor="#450a0a" />
              <stop offset="100%" stopColor="#0a0000" />
            </linearGradient>
          </defs>

          {/* 15,000,000° Solar Disc Aura rising above horizon */}
          <circle cx="500" cy="70" r="170" fill="url(#sun_core_grad)" />
          <circle cx="500" cy="70" r="85" stroke="#fef08a" strokeWidth="3.5" opacity="0.9" filter="drop-shadow(0 0 25px #f97316)" />
          <circle cx="500" cy="70" r="48" fill="#fffbeb" />

          {/* Charred Earth with Magma Cracks */}
          <path
            d="M0 370 L0 260 L180 240 L320 270 L480 230 L640 260 L800 220 L1000 250 L1000 370 Z"
            fill="#0f0202"
          />
          <path d="M40 300 Q120 270 200 290 Q280 310 350 270" stroke="#f97316" strokeWidth="3" opacity="0.95" />
          <path d="M500 280 Q600 250 720 290 Q820 320 920 270" stroke="#ea580c" strokeWidth="3" opacity="0.95" />

          {/* Colossal Scorched Katana Blade SHOOTING OUT OF TOP FRAME */}
          <g transform="translate(100, 130) rotate(-16)">
            <path
              d="M-50 0 L780 0 Q810 4 850 18 L790 24 L-50 24 Z"
              fill="url(#blade_charred)"
              filter="drop-shadow(0 0 20px #f97316)"
            />
            <line x1="-50" y1="2" x2="830" y2="12" stroke="#ffffff" strokeWidth="2.5" />
            <rect x="-80" y="-12" width="30" height="48" rx="4" fill="#180404" stroke="#f97316" strokeWidth="2" />
            <rect x="-180" y="-4" width="100" height="32" rx="3" fill="#0a0000" stroke="#ea580c" strokeWidth="1.5" />
            <polygon points="-160,0 -150,12 -160,24 -170,12" fill="#f97316" />
            <polygon points="-130,0 -120,12 -130,24 -140,12" fill="#f97316" />
            <polygon points="-100,0 -90,12 -100,24 -110,12" fill="#f97316" />
          </g>

          {/* Rising Sparks flying out of top frame */}
          <circle cx="280" cy="140" r="3.5" fill="#fef08a" opacity="0.95" filter="drop-shadow(0 0 8px #f97316)" />
          <circle cx="360" cy="60" r="3" fill="#f97316" opacity="0.9" />
          <circle cx="430" cy="-20" r="4" fill="#fef08a" opacity="0.95" filter="drop-shadow(0 0 8px #f97316)" />
          <circle cx="610" cy="90" r="3" fill="#fef08a" opacity="0.9" />
          <circle cx="680" cy="20" r="3.5" fill="#f97316" opacity="0.85" />
          <circle cx="750" cy="-30" r="3" fill="#fef08a" opacity="0.9" />
        </svg>
      )}

      {/* 4. PERFECT SUSANOO: ARMOR OF THE TENGU */}
      {isSusanoo && (
        <svg
          viewBox="0 -80 1000 450"
          className="w-full h-full object-cover overflow-visible drop-shadow-[0_20px_45px_rgba(0,0,0,0.95)] pointer-events-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="susanoo_chakra_grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d8b4fe" />
              <stop offset="50%" stopColor="#7e22ce" />
              <stop offset="100%" stopColor="#1e053a" />
            </linearGradient>
            <linearGradient id="wing_grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.85" />
              <stop offset="70%" stopColor="#6b21a8" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#1e053a" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Colossal Ethereal Feathered Chakra Wings SOARING PAST TOP & SIDES */}
          <path
            d="M500 180 C350 110 200 -30 40 50 C-10 120 70 210 190 250 C320 280 450 230 500 180 Z"
            fill="url(#wing_grad)"
            stroke="#a855f7"
            strokeWidth="2"
          />
          <path d="M120 80 L50 160 M180 110 L110 200 M260 150 L190 240" stroke="#c084fc" strokeWidth="2.5" opacity="0.7" />

          <path
            d="M500 180 C650 110 800 -30 960 50 C1010 120 930 210 810 250 C680 280 550 230 500 180 Z"
            fill="url(#wing_grad)"
            stroke="#a855f7"
            strokeWidth="2"
          />
          <path d="M880 80 L950 160 M820 110 L890 200 M740 150 L810 240" stroke="#c084fc" strokeWidth="2.5" opacity="0.7" />

          {/* Crossed Celestial Katana Hilts piercing frame */}
          <line x1="280" y1="-40" x2="720" y2="340" stroke="#c084fc" strokeWidth="4.5" filter="drop-shadow(0 0 12px #c084fc)" />
          <line x1="720" y1="-40" x2="280" y2="340" stroke="#c084fc" strokeWidth="4.5" filter="drop-shadow(0 0 12px #c084fc)" />

          {/* Perfect Susanoo Tengu Armored Mask / Helmet in Center with Horns POPPING OUT */}
          <g transform="translate(500, 130)">
            <path
              d="M-80 90 L-100 -20 L-60 -70 L0 -105 L60 -70 L100 -20 L80 90 Z"
              fill="url(#susanoo_chakra_grad)"
              stroke="#e9d5ff"
              strokeWidth="2.5"
            />
            {/* Massive Horned Spikes soaring above top border */}
            <path d="M-60 -70 L-95 -145 L-40 -90 Z" fill="#9333ea" stroke="#e9d5ff" strokeWidth="2" filter="drop-shadow(0 0 10px #a855f7)" />
            <path d="M60 -70 L95 -145 L40 -90 Z" fill="#9333ea" stroke="#e9d5ff" strokeWidth="2" filter="drop-shadow(0 0 10px #a855f7)" />
            <polygon points="0,-80 15,-60 0,-40 -15,-60" fill="#67e8f9" filter="drop-shadow(0 0 12px #67e8f9)" />

            <path d="M-55 -25 L55 -25 L45 50 L0 75 L-45 50 Z" fill="#090117" stroke="#c084fc" strokeWidth="1.8" />
            <ellipse cx="-24" cy="5" rx="14" ry="4" fill="#fbbf24" filter="drop-shadow(0 0 10px #fbbf24)" />
            <ellipse cx="24" cy="5" rx="14" ry="4" fill="#fbbf24" filter="drop-shadow(0 0 10px #fbbf24)" />
            <circle cx="-24" cy="5" r="2.5" fill="#ffffff" />
            <circle cx="24" cy="5" r="2.5" fill="#ffffff" />
            <polygon points="0,-15 8,30 0,38 -8,30" fill="#7e22ce" stroke="#e9d5ff" strokeWidth="1" />
            <path d="M-30 60 L0 75 L30 60" stroke="#c084fc" strokeWidth="2" />
          </g>

          {/* Rotating Magatama / Tomoe Energy Rings */}
          <g transform="translate(500, 130)" opacity="0.7">
            <circle cx="0" cy="0" r="180" stroke="#c084fc" strokeWidth="1.8" strokeDasharray="6 14" />
            <circle cx="-170" cy="0" r="9" fill="#e9d5ff" filter="drop-shadow(0 0 8px #c084fc)" />
            <circle cx="170" cy="0" r="9" fill="#e9d5ff" filter="drop-shadow(0 0 8px #c084fc)" />
            <circle cx="0" cy="-170" r="9" fill="#e9d5ff" filter="drop-shadow(0 0 8px #c084fc)" />
            <circle cx="0" cy="170" r="9" fill="#e9d5ff" filter="drop-shadow(0 0 8px #c084fc)" />
          </g>
        </svg>
      )}

      {/* 5. KURO-RYU IMPERIAL DRAGON SOVEREIGN (DEFAULT / ORIGINAL EXCLUSIVE) */}
      {isDragon && (
        <svg
          viewBox="0 -80 1000 450"
          className="w-full h-full object-cover overflow-visible drop-shadow-[0_20px_45px_rgba(0,0,0,0.95)] pointer-events-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="dragon_body_grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e11d48" />
              <stop offset="45%" stopColor="#1c040b" />
              <stop offset="100%" stopColor="#050103" />
            </linearGradient>

            <linearGradient id="dragon_belly_grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fda4af" />
              <stop offset="100%" stopColor="#4c0519" />
            </linearGradient>

            <linearGradient id="dragon_horn_grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#881337" />
              <stop offset="60%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>

            <radialGradient id="dragon_pearl_grad" cx="40%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#fda4af" />
              <stop offset="60%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#4c0519" />
            </radialGradient>

            <pattern id="scale_pattern" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M0 8 Q8 0 16 8 Q8 16 0 8 Z" fill="none" stroke="#e11d48" strokeWidth="0.8" opacity="0.3" />
            </pattern>
          </defs>

          {/* Serpentine Dragon Body Outer Spine */}
          <path
            d="M-50,320 C180,330 220,160 340,170 C460,180 480,290 620,270 C760,250 780,90 880,120 C950,140 980,230 1050,210"
            stroke="url(#dragon_body_grad)"
            strokeWidth="84"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Scale Texture Overlay on Serpentine Body */}
          <path
            d="M-50,320 C180,330 220,160 340,170 C460,180 480,290 620,270 C760,250 780,90 880,120 C950,140 980,230 1050,210"
            stroke="url(#scale_pattern)"
            strokeWidth="76"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
          />

          {/* Radiant Spine Fins reaching high */}
          <path
            d="M120,220 L135,180 L155,215 M240,145 L260,100 L275,140 M380,180 L400,135 L415,175 M520,250 L540,200 L555,245 M680,190 L700,130 L715,180"
            stroke="#e11d48"
            strokeWidth="4"
            strokeLinejoin="round"
            fill="#fda4af"
            fillOpacity="0.45"
          />

          {/* Sacred Cosmic Dragon Pearl (Hōju) clutched in claws bursting downward */}
          <g transform="translate(680, 240)">
            <circle cx="0" cy="0" r="34" fill="url(#dragon_pearl_grad)" filter="drop-shadow(0 0 30px #f43f5e)" />
            <circle cx="0" cy="0" r="44" stroke="#fda4af" strokeWidth="1.8" strokeDasharray="3 6" opacity="0.85" />
            <circle cx="0" cy="0" r="56" stroke="#e11d48" strokeWidth="1.2" strokeDasharray="1 8" opacity="0.7" />
            <circle cx="-10" cy="-10" r="9" fill="#ffffff" opacity="0.95" />
          </g>

          {/* Ferocious Dragon Claws grasping the orb */}
          <g transform="translate(680, 240)">
            <path d="M-40 -15 Q-20 -32 0 -26" stroke="#fda4af" strokeWidth="6.5" strokeLinecap="round" />
            <path d="M-44 14 Q-20 30 8 22" stroke="#fda4af" strokeWidth="6.5" strokeLinecap="round" />
            <path d="M-48 0 Q-15 0 15 -4" stroke="#fda4af" strokeWidth="7.5" strokeLinecap="round" />
            <path d="M-2 -26 L8 -30 L-1 -22 Z" fill="#ffffff" />
            <path d="M6 22 L16 27 L8 17 Z" fill="#ffffff" />
            <path d="M15 -4 L26 -3 L16 3 Z" fill="#ffffff" />
          </g>

          {/* Mighty Dragon Head with ANTLER HORNS BURSTING WAY OUT ABOVE BANNER */}
          <g transform="translate(840, 90)">
            {/* Cranium and Jaw */}
            <path
              d="M-40 20 C-30 -30 30 -50 80 -30 C120 -15 150 10 160 35 C140 45 100 40 80 50 C40 65 -10 60 -40 20 Z"
              fill="url(#dragon_body_grad)"
              stroke="#fda4af"
              strokeWidth="2.5"
            />
            <path d="M-20 30 C30 50 80 55 120 40 C90 65 20 75 -20 45 Z" fill="#1c040b" stroke="#e11d48" strokeWidth="1.8" />
            <polygon points="40,32 46,48 52,32" fill="#ffffff" />
            <polygon points="65,30 72,50 78,30" fill="#ffffff" />
            <polygon points="90,26 96,44 102,26" fill="#ffffff" />

            {/* Glowing Dragon Eye */}
            <ellipse cx="45" cy="-2" rx="14" ry="7.5" fill="#ffffff" filter="drop-shadow(0 0 12px #ffffff)" />
            <ellipse cx="45" cy="-2" rx="4.5" ry="7.5" fill="#881337" />
            <ellipse cx="46" cy="-3" rx="2" ry="3" fill="#ffffff" />
            <path d="M30 -2 L-5 -12" stroke="#fda4af" strokeWidth="3" strokeLinecap="round" />

            {/* Imperial Antler Horns POPPING DEEP OUT OF THE BANNER TOP */}
            <path
              d="M-10 -40 C-25 -110 -70 -150 -125 -175 C-90 -130 -80 -80 -40 -35 M-80 -125 C-120 -115 -145 -105 -165 -110"
              stroke="url(#dragon_horn_grad)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="drop-shadow(0 0 14px #e11d48)"
            />

            {/* Flowing Whiskers (Kuro Senshi) streaming up and out */}
            <path
              d="M100 25 C145 0 190 20 235 -5 M100 25 C135 40 180 70 220 55"
              stroke="#fda4af"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.95"
            />
          </g>

          {/* Floating Astral Embers soaring out */}
          <circle cx="210" cy="70" r="3" fill="#fda4af" opacity="0.9" />
          <circle cx="390" cy="90" r="3.5" fill="#fda4af" opacity="0.95" />
          <circle cx="580" cy="50" r="2.5" fill="#fda4af" opacity="0.85" />
          <circle cx="760" cy="-25" r="4" fill="#ffffff" opacity="0.95" filter="drop-shadow(0 0 6px #fda4af)" />
          <circle cx="890" cy="270" r="3" fill="#fda4af" opacity="0.85" />
        </svg>
      )}
    </div>
  );
};
