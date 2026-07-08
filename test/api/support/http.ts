// Device-free API harness. Node 18+ global fetch — no axios, no browser, no
// device. Base URLs point at staging; override via env.
export const AUTH_BASE = process.env.AUTH_BASE_URL ?? 'https://auth.94-136-184-52.sslip.io';
export const MSG_BASE = process.env.MSG_BASE_URL ?? 'https://relay.94-136-184-52.sslip.io';

export interface ApiResult {
  status: number;
  json: any;
  text: string;
}

async function request(
  base: string,
  method: string,
  path: string,
  opts: { body?: unknown; token?: string; headers?: Record<string, string> } = {},
): Promise<ApiResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(opts.headers ?? {}) };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const res = await fetch(base + path, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON body — leave json null, keep text */
  }
  return { status: res.status, json, text };
}

export const authPost = (path: string, body: unknown, token?: string, headers?: Record<string, string>) =>
  request(AUTH_BASE, 'POST', path, { body, token, headers });
export const authGet = (path: string, token?: string) =>
  request(AUTH_BASE, 'GET', path, { token });
export const authDelete = (path: string, token: string, body?: unknown) =>
  request(AUTH_BASE, 'DELETE', path, { token, body });
export const authPatch = (path: string, body: unknown, token?: string, headers?: Record<string, string>) =>
  request(AUTH_BASE, 'PATCH', path, { body, token, headers });

export const msgPost = (path: string, body: unknown, token?: string, headers?: Record<string, string>) =>
  request(MSG_BASE, 'POST', path, { body, token, headers });
export const msgGet = (path: string, token?: string, headers?: Record<string, string>) =>
  request(MSG_BASE, 'GET', path, { token, headers });
