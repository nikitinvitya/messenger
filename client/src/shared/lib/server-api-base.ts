import { cookies, headers } from 'next/headers';
import { BASE_URL } from '@/shared/constants/api';

/**
 * Cookie header for Server Components → Go API (same jar as the browser request).
 */
export async function getServerApiCookieHeader(): Promise<string | undefined> {
  const store = await cookies();
  const all = store.getAll();
  if (all.length) {
    return all.map((c) => `${c.name}=${c.value}`).join('; ');
  }
  return (await headers()).get('cookie') ?? undefined;
}

function backendOriginFromEnv(): string | undefined {
  const proxy = process.env.BACKEND_PROXY_TARGET?.trim()?.replace(/\/$/, '');
  if (proxy) return proxy;
  const origin = process.env.NEXT_PUBLIC_BACKEND_ORIGIN?.trim()?.replace(/\/$/, '');
  if (origin) return origin;
  return undefined;
}

/**
 * Absolute API base for Server Components.
 * Prefer Render (or local Go) directly + Cookie header — not a self-request to Vercel /api/v1.
 */
export async function getServerApiBaseUrl(): Promise<string> {
  const backend = backendOriginFromEnv();
  if (backend) {
    return `${backend}/api/v1`;
  }

  if (BASE_URL.startsWith('http')) {
    return BASE_URL.replace(/\/$/, '');
  }

  const h = await headers();
  const host = (h.get('x-forwarded-host') ?? h.get('host') ?? '').split(',')[0].trim();
  const proto = (h.get('x-forwarded-proto') ?? 'http').split(',')[0].trim();
  if (!host) {
    return 'http://localhost:3000/api/v1';
  }
  const path = BASE_URL.startsWith('/') ? BASE_URL : `/${BASE_URL}`;
  return `${proto}://${host}${path}`;
}
