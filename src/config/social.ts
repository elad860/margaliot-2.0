/** Social networks stored once in SiteSettings and used everywhere (UX review F11). Each is optional. */
export const SOCIAL_NETWORKS = [
  { key: 'instagram', label: 'אינסטגרם', hosts: ['instagram.com'] },
  { key: 'tiktok', label: 'טיקטוק', hosts: ['tiktok.com'] },
  { key: 'youtube', label: 'יוטיוב', hosts: ['youtube.com', 'youtu.be'] },
  { key: 'whatsappCommunity', label: 'קבוצת וואטסאפ', hosts: ['chat.whatsapp.com', 'whatsapp.com', 'wa.me'] },
] as const

export type SocialKey = (typeof SOCIAL_NETWORKS)[number]['key']
