const raw = process.env.NEXT_PUBLIC_BASE_URL?.trim() ?? '';

/** Browser axios base: full URL locally, or same-origin `/api/v1` on Vercel (rewrite → Render). */
export const BASE_URL =
  raw === '' ? '/api/v1' : raw.startsWith('/') ? raw : raw.replace(/\/$/, '');

/** Go origin without path — uploads, avatars, absolute media. Required when BASE_URL is relative. */
export const BACKEND_ORIGIN = (() => {
  const explicit = process.env.NEXT_PUBLIC_BACKEND_ORIGIN?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  if (raw.startsWith('http')) {
    return raw.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
  }
  return '';
})();

export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_BASE_URL?.trim() ||
  (BACKEND_ORIGIN ? `${BACKEND_ORIGIN.replace(/^http/, 'ws')}/api/v1` : '');
