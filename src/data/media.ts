import type { EventType } from '@/types';

/**
 * Curated, on-theme photography for OurMoment.
 *
 * These are bespoke, generated editorial images (one per event world, a welcome
 * hero, and a wedding gallery pool for the demo) hosted on a CDN. They are real,
 * relevant, and lavish — chosen so every surface looks finished out of the box.
 *
 * NOTE FOR PRODUCTION: these point at a generation CDN. Before launch, move the
 * final art into your own storage/bucket (or bundle it) and update the URLs here
 * — this is the single place imagery is referenced from.
 */

const CDN = 'https://d8j0ntlcm91z4.cloudfront.net/user_3EeygzZkZF3sIzA9qAaLtwa7A0N';

/** Full-quality hero/cover images (PNG). */
export const EVENT_COVERS: Record<EventType, string> = {
  marriage: `${CDN}/hf_20260608_231600_5cc3904c-6570-4de9-82af-9165836b214a.png`,
  confirmation: `${CDN}/hf_20260608_231743_b02c4c00-64d2-4ba1-8b9a-74c04d1f7ae5.png`,
  baptism: `${CDN}/hf_20260608_231754_60715e36-2b8e-4dde-a4e4-d3865397ae51.png`,
  birthday: `${CDN}/hf_20260608_231755_577d0eed-cc42-4d25-a8df-234f174dbd48.png`,
  special: `${CDN}/hf_20260608_231756_64879185-f057-48f7-a56a-d3b52f4b0883.png`,
};

export const WELCOME_IMAGE = `${CDN}/hf_20260608_231757_2a8e6bdf-2548-4a0b-b5e0-c2809fa51551.png`;

/** Lighter WebP versions of the wedding pool, for the demo gallery + swipe deck. */
export const WEDDING_GALLERY: string[] = [
  `${CDN}/hf_20260608_231758_8b707544-4a5c-4d61-9f46-4c21eb500e36_min.webp`,
  `${CDN}/hf_20260608_231758_a74901e0-b367-42c0-bd69-6e8256850bfa_min.webp`,
  `${CDN}/hf_20260608_231758_603ea264-7605-4250-9c02-d86f03662614_min.webp`,
  `${CDN}/hf_20260608_231758_495df105-8ecb-40a6-a7e8-ad5438383586_min.webp`,
  `${CDN}/hf_20260608_231759_51bb14cc-7172-4efb-a47c-09403e42c420_min.webp`,
  `${CDN}/hf_20260608_231759_09b202f3-422b-4c03-8a5d-638e984a4206_min.webp`,
  `${CDN}/hf_20260608_231759_c7321412-df7c-4ab6-b3e4-a24de7142e11_min.webp`,
  `${CDN}/hf_20260608_231759_a63416a8-d1a7-4113-881e-a070f9b42c4a_min.webp`,
];

/** The marriage cover doubles nicely as a gallery hero. */
export const DEMO_GALLERY_POOL: string[] = [EVENT_COVERS.marriage, ...WEDDING_GALLERY];
