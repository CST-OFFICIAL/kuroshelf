export interface SocialLink {
  name: string;
  url: string;
  platform: 'instagram' | 'twitter' | 'youtube' | 'discord';
}

export const siteConfig = {
  name: 'Kuro Shelf',
  description:
    'Modern anime & manga discovery, personal shelf tracking, community predictions, and where-to-watch streaming directory.',
  // Configurable public contact email (empty by default if not configured)
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || '',

  // Configurable affiliate settings
  affiliate: {
    amazonAssociatesActive: import.meta.env.VITE_AMAZON_AFFILIATE_ACTIVE === 'true',
    amazonTag: import.meta.env.VITE_AMAZON_AFFILIATE_TAG || '',
    disclosureText:
      'As an Amazon Associate, Kuro Shelf earns from qualifying purchases made through book and manga affiliate links.',
  },

  // Configurable external discussion / Disqus
  disqusUrl: import.meta.env.VITE_DISQUS_URL || '',
  disqusShortname: import.meta.env.VITE_DISQUS_SHORTNAME || '',

  // Configurable social platform URLs (empty by default so no fake handles are displayed)
  socials: {
    instagram: import.meta.env.VITE_SOCIAL_INSTAGRAM || '',
    twitter: import.meta.env.VITE_SOCIAL_TWITTER || '',
    youtube: import.meta.env.VITE_SOCIAL_YOUTUBE || '',
    discord: import.meta.env.VITE_SOCIAL_DISCORD || '',
  },
};

/**
 * Returns only the social platforms that have a real, configured URL.
 * Will not invent handles or fake URLs.
 */
export function getActiveSocials(): SocialLink[] {
  const links: SocialLink[] = [];

  if (siteConfig.socials.instagram && siteConfig.socials.instagram.trim().startsWith('http')) {
    links.push({
      name: 'Instagram',
      url: siteConfig.socials.instagram.trim(),
      platform: 'instagram',
    });
  }

  if (siteConfig.socials.twitter && siteConfig.socials.twitter.trim().startsWith('http')) {
    links.push({
      name: 'X / Twitter',
      url: siteConfig.socials.twitter.trim(),
      platform: 'twitter',
    });
  }

  if (siteConfig.socials.youtube && siteConfig.socials.youtube.trim().startsWith('http')) {
    links.push({
      name: 'YouTube',
      url: siteConfig.socials.youtube.trim(),
      platform: 'youtube',
    });
  }

  if (siteConfig.socials.discord && siteConfig.socials.discord.trim().startsWith('http')) {
    links.push({
      name: 'Discord',
      url: siteConfig.socials.discord.trim(),
      platform: 'discord',
    });
  }

  return links;
}
