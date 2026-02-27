import type { ImageMetadata } from 'astro';

const thumbnails = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/img/*.{jpg,jpeg,png,webp}',
  { eager: true }
);

export function getNewsThumbnail(thumbnailPath: string): ImageMetadata | null {
  const filename = thumbnailPath.split('/').pop() || '';
  const key = Object.keys(thumbnails).find((k) => k.endsWith(filename));
  return key ? (thumbnails[key] as { default: ImageMetadata }).default : null;
}
