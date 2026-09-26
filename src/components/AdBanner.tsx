import { memo } from 'react';

interface AdBannerProps {
  slot?: string;
  format?: 'horizontal' | 'card' | 'inline' | 'skyscraper';
  className?: string;
}

export const AdBanner = memo(function AdBanner({
  slot = 'default',
  format = 'horizontal',
  className = '',
}: AdBannerProps) {
  const adClient = 'ca-pub-5984128562562799';

  return (
    <div className={`overflow-hidden text-center my-4 ${className}`} data-ad-slot={slot}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adClient}
        data-ad-slot={slot}
        data-ad-format={format === 'skyscraper' ? 'vertical' : 'auto'}
        data-full-width-responsive="true"
      />
    </div>
  );
});
