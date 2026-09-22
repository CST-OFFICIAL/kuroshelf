import React from 'react';
import { Check } from 'lucide-react';

interface VerifiedMemberBadgeProps {
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  showTooltip?: boolean;
}

export const VerifiedMemberBadge: React.FC<VerifiedMemberBadgeProps> = ({
  size = 'sm',
  className = '',
  showTooltip = true,
}) => {
  const sizeClasses = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-4.5 h-4.5',
  }[size];

  const iconSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
  }[size];

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 via-blue-500 to-indigo-600 text-white shadow-xs ring-1 ring-white/30 dark:ring-sky-400/30 shrink-0 select-none ${sizeClasses} ${className}`}
      title={showTooltip ? 'Verified Kuro VIP Member' : undefined}
      aria-label="Verified Kuro VIP Member"
    >
      <Check className={`${iconSizes} stroke-[3.5]`} />
    </span>
  );
};
