import React from 'react';

interface AdminDragonBannerProps {
  themeId?: string; // 'kuro_sovereign' | 'celestial_shogun' | 'abyssal_eclipse'
  interactive?: boolean;
}

export const AdminDragonBanner: React.FC<AdminDragonBannerProps> = ({
  themeId = 'kuro_sovereign',
  interactive = true
}) => {
  // Theme-specific color parameters
  const isGold = themeId === 'celestial_shogun';
  const isVoid = themeId === 'abyssal_eclipse';

  const dragonPrimary = isGold ? '#f59e0b' : isVoid ? '#818cf8' : '#e11d48';
  const dragonSecondary = isGold ? '#fef08a' : isVoid ? '#c084fc' : '#fda4af';
  const dragonBodyDark = isGold ? '#78350f' : isVoid ? '#1e1b4b' : '#1c040b';
  const eyeColor = isGold ? '#ffffff' : isVoid ? '#22d3ee' : '#ffffff';
  const orbColor = isGold ? '#fbbf24' : isVoid ? '#a855f7' : '#f43f5e';

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-10 select-none">
      {/* Dynamic Background Aura & Kanji Watermark */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-8xl md:text-9xl font-black text-white/[0.04] font-serif tracking-widest pointer-events-none">
        {isGold ? '神竜' : isVoid ? '深淵' : '黒竜'}
      </div>

      {/* Ambient Particle Nebula / Swirling vortex */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Serpentine Dragon Vector Illustration Popping OUT of the frame */}
      <svg
        viewBox="0 0 1000 360"
        className="w-full h-full object-cover overflow-visible drop-shadow-[0_15px_35px_rgba(0,0,0,0.9)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Dragon Scale Gradients */}
          <linearGradient id="dragon_body_grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={dragonPrimary} />
            <stop offset="50%" stopColor={dragonBodyDark} />
            <stop offset="100%" stopColor="#050103" />
          </linearGradient>

          <linearGradient id="dragon_belly_grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={dragonSecondary} />
            <stop offset="100%" stopColor={dragonPrimary} />
          </linearGradient>

          <linearGradient id="dragon_orb_glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor={dragonSecondary} />
            <stop offset="80%" stopColor={orbColor} />
            <stop offset="100%" stopColor={dragonBodyDark} />
          </linearGradient>

          <filter id="dragon_glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="soft_glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="15" result="blur" />
          </filter>
        </defs>

        {/* --- Dragon Body Serpentine Curves --- */}
        {/* Deep background body loops */}
        <path
          d="M950,40 C850,-20 720,80 620,30 C520,-20 450,110 360,70 C280,30 200,100 130,160"
          stroke="url(#dragon_body_grad)"
          strokeWidth="60"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Dragon Ventral Belly Plates */}
        <path
          d="M940,55 C845,-5 715,95 615,45 C515,-5 445,125 355,85 C275,45 195,115 125,175"
          stroke="url(#dragon_belly_grad)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray="6 4"
          opacity="0.7"
        />

        {/* Dorsal Spines along the spine */}
        <g stroke={dragonSecondary} strokeWidth="3" opacity="0.8">
          <path d="M850,0 L855,-15 M780,25 L788,10 M700,55 L705,38 M630,30 L635,12 M560,10 L564,-6 M490,40 L492,22 M420,80 L418,60 M340,75 L334,55 M260,85 L252,65 M190,120 L180,100" />
        </g>

        {/* --- Foreground Loop that curves DOWN & POPS OUT of the banner --- */}
        {/* This lower curve arcs downwards toward the avatar area */}
        <path
          d="M380,80 C320,130 240,150 180,220 C140,270 120,320 80,350"
          stroke="url(#dragon_body_grad)"
          strokeWidth="70"
          strokeLinecap="round"
        />
        {/* Ventral ridges on the popping curve */}
        <path
          d="M375,95 C315,145 235,165 175,235 C135,285 115,335 75,360"
          stroke="url(#dragon_belly_grad)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray="8 5"
        />

        {/* --- Menacing Draconic Claws (Bursting out forward) --- */}
        {/* Main Claw reaching downward over the banner border */}
        <g transform="translate(190, 240) scale(0.95)">
          <path d="M0,0 C20,30 50,60 70,80" stroke={dragonBodyDark} strokeWidth="32" strokeLinecap="round" />
          {/* 4 Sharp Talons */}
          <path d="M50,70 Q70,95 85,120 Q65,100 50,90" fill={dragonSecondary} />
          <path d="M65,65 Q95,85 115,105 Q90,90 75,75" fill={dragonSecondary} />
          <path d="M75,55 Q110,65 130,80 Q105,72 85,60" fill={dragonSecondary} />
          <path d="M35,75 Q45,105 50,130 Q40,105 32,85" fill={dragonSecondary} />
          {/* Talon edge gleam */}
          <circle cx="85" cy="118" r="2" fill="#fff" />
          <circle cx="115" cy="103" r="2" fill="#fff" />
        </g>

        {/* Secondary Left Claw clutching the Cosmic Dragon Pearl */}
        <g transform="translate(60, 210) scale(0.85)">
          <path d="M60,-20 C40,20 10,40 -20,60" stroke={dragonBodyDark} strokeWidth="26" strokeLinecap="round" />
          {/* Claws wrapped around the orb */}
          <path d="M-10,50 Q-30,70 -50,85 Q-35,65 -20,55" fill={dragonSecondary} />
          <path d="M0,60 Q-10,90 -20,110 Q-12,85 -2,70" fill={dragonSecondary} />
          <path d="M15,65 Q20,95 25,120 Q18,92 10,75" fill={dragonSecondary} />
          {/* The Cosmic Dragon Orb (Hoju 宝珠) */}
          <circle cx="-10" cy="85" r="28" fill="url(#dragon_orb_glow)" filter="url(#dragon_glow)" />
          <circle cx="-16" cy="78" r="7" fill="#ffffff" opacity="0.9" />
          {/* Energy rings around orb */}
          <ellipse cx="-10" cy="85" rx="36" ry="12" stroke={dragonSecondary} strokeWidth="2" opacity="0.8" transform="rotate(-25 -10 85)" />
        </g>

        {/* --- Magnificent Serpentine Dragon Head --- */}
        <g transform="translate(90, 80) scale(1.15)">
          {/* Mane / Fiery Neck Tendrils */}
          <path d="M100,50 Q140,20 170,30 Q130,60 110,70" fill={dragonPrimary} opacity="0.9" />
          <path d="M90,70 Q130,60 160,80 Q120,90 95,95" fill={dragonPrimary} opacity="0.9" />
          <path d="M80,95 Q120,105 150,130 Q110,125 85,115" fill={dragonPrimary} opacity="0.9" />

          {/* Antler / Dragon Horns (Majestic Imperial Stags) */}
          <path
            d="M50,10 C65,-25 90,-40 120,-45 C100,-30 95,-15 90,5 M85,-25 C105,-28 125,-15 135,0 C115,-5 100,0 90,10"
            fill={dragonSecondary}
            stroke={dragonBodyDark}
            strokeWidth="2"
          />
          {/* Front Horn */}
          <path
            d="M30,15 C40,-15 60,-30 85,-35 C70,-20 65,-8 60,10"
            fill={dragonSecondary}
            stroke={dragonBodyDark}
            strokeWidth="1.5"
          />

          {/* Dragon Snout & Cranium */}
          <path
            d="M-20,60 C-35,45 -30,25 0,20 C30,15 65,25 70,50 C75,70 50,85 20,85 C-5,85 -15,70 -20,60 Z"
            fill="url(#dragon_body_grad)"
            stroke={dragonPrimary}
            strokeWidth="2"
          />

          {/* Lower Jaw (Bared in Roar) */}
          <path
            d="M-15,65 C-25,75 -20,90 5,95 C25,100 45,95 55,80 C35,80 10,75 -15,65 Z"
            fill="#18040a"
            stroke={dragonPrimary}
            strokeWidth="1.5"
          />

          {/* Razor Dragon Fangs */}
          <polygon points="-15,55 -10,70 -5,55" fill="#ffffff" />
          <polygon points="-5,54 0,68 5,54" fill="#ffffff" />
          <polygon points="10,54 14,64 18,54" fill="#ffffff" />
          <polygon points="-12,78 -8,66 -4,78" fill="#ffffff" />
          <polygon points="-2,80 2,68 6,80" fill="#ffffff" />

          {/* Glowing Draconic Eye */}
          <ellipse cx="20" cy="38" rx="8" ry="5.5" fill={eyeColor} filter="url(#dragon_glow)" />
          <polygon points="17,38 23,34 23,42" fill="#000000" />
          {/* Eye streak / aura */}
          <path d="M26,38 Q45,30 60,32" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />

          {/* Long Flowing Dragon Whiskers (Barbel) reaching down */}
          <path
            d="M-25,48 C-50,55 -70,90 -60,140 C-55,170 -30,200 -10,230"
            stroke={dragonSecondary}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            filter="url(#dragon_glow)"
          />
          <path
            d="M-20,55 C-40,75 -45,115 -35,160 C-25,190 -5,220 15,250"
            stroke={dragonPrimary}
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Nasal Flare & Smoke Mist */}
          <circle cx="-22" cy="46" r="3" fill="#090103" />
          <path d="M-28,45 Q-45,35 -60,40" stroke={dragonSecondary} strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        </g>

        {/* --- Floating Fire Embers & Astral Sparkles --- */}
        <g fill={dragonSecondary} opacity="0.85">
          <circle cx="280" cy="140" r="2.5" className="animate-pulse" />
          <circle cx="340" cy="60" r="3.5" className="animate-ping" />
          <circle cx="160" cy="190" r="2" />
          <circle cx="220" cy="280" r="3" className="animate-pulse" />
          <circle cx="110" cy="330" r="2" />
          <circle cx="480" cy="45" r="2.5" />
          <circle cx="680" cy="20" r="3" className="animate-pulse" />
        </g>
      </svg>
    </div>
  );
};
