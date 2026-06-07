/**
 * Decorative imagery helpers.
 *
 * We use Picsum (https://picsum.photos) for generic, always-available decor.
 * Seeds keep a given image stable across reloads so layouts don't flicker.
 * Swap these for branded art or curated Unsplash collections before launch.
 */

export function decorImage(seed: string, width = 1200, height = 1600): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}

export function decorSquare(seed: string, size = 800): string {
  return decorImage(seed, size, size);
}
