import { Image as RNImage } from 'react-native';
import type { EventType } from '@/types';

/**
 * Curated, on-theme photography for OurMoment.
 *
 * Covers and gallery shots that ship with the app. Most are now Matty's own
 * bundled photos (see assets/images/events/ — drop a file there and wire it in
 * here to use it). Confirmation + Special still use the original on-theme
 * generated art until real photos are added for those events.
 *
 * Bundled assets are resolved to URIs so every screen can keep using the same
 * `<Image source={{ uri }} />` shape, whether the image is local or remote.
 */

const CDN = 'https://d8j0ntlcm91z4.cloudfront.net/user_3EeygzZkZF3sIzA9qAaLtwa7A0N';

/** Turn a bundled `require(...)` asset into a URI string usable by expo-image. */
const bundled = (mod: number): string => RNImage.resolveAssetSource(mod).uri;

/** Full-quality hero/cover images. */
export const EVENT_COVERS: Record<EventType, string> = {
  marriage: bundled(require('../../assets/images/events/marriage.jpg')),
  confirmation: `${CDN}/hf_20260608_231743_b02c4c00-64d2-4ba1-8b9a-74c04d1f7ae5.png`,
  baptism: bundled(require('../../assets/images/events/baptism.jpg')),
  birthday: bundled(require('../../assets/images/events/birthday.jpg')),
  special: `${CDN}/hf_20260608_231756_64879185-f057-48f7-a56a-d3b52f4b0883.png`,
};

export const WELCOME_IMAGE = bundled(require('../../assets/images/events/welcome.jpg'));

/** Wedding photo pool for the demo gallery + swipe deck. */
export const WEDDING_GALLERY: string[] = [
  bundled(require('../../assets/images/events/gallery-1.jpg')),
  bundled(require('../../assets/images/events/gallery-2.jpg')),
  bundled(require('../../assets/images/events/gallery-3.jpg')),
  bundled(require('../../assets/images/events/gallery-4.jpg')),
  bundled(require('../../assets/images/events/gallery-5.jpg')),
];

/** The marriage cover doubles nicely as a gallery hero. */
export const DEMO_GALLERY_POOL: string[] = [EVENT_COVERS.marriage, ...WEDDING_GALLERY];
