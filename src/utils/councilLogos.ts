import type { ImageMetadata } from 'astro';

const councilLogos = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/img/councils/*.png',
  { eager: true }
);

export function getCouncilLogo(logoPath: string): ImageMetadata | null {
  const filename = logoPath.split('/').pop() || '';
  const key = Object.keys(councilLogos).find((k) => k.endsWith(filename));
  return key ? (councilLogos[key] as { default: ImageMetadata }).default : null;
}
