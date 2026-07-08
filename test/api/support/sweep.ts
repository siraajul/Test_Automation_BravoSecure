import { authGet, type ApiResult } from './http';
import { expectPayload } from './shape';

type Getter = (path: string, token?: string, headers?: Record<string, string>) => Promise<ApiResult>;

/**
 * Register a read sweep as one `it` per path with the SMART assertion baked in:
 *   - the endpoint must not 5xx (it's wired + not crashing), AND
 *   - any 200 must return a real payload (array or non-empty object).
 * A legit 4xx (role/param-gated) still passes — it's reachable, just not for us.
 */
export function sweepReads(
  label: string,
  paths: string[],
  getToken: () => Promise<string | undefined>,
  opts: { get?: Getter; headers?: Record<string, string> } = {},
): void {
  const get = opts.get ?? authGet;
  const state: { token?: string } = {};
  beforeAll(async () => {
    state.token = await getToken();
  });
  for (const path of paths) {
    it(`GET ${path}`, async () => {
      const r = await get(path, state.token, opts.headers);
      if (r.status >= 400) console.log(label, path, '=>', r.status);
      expect(r.status).toBeLessThan(500);
      if (r.status === 200) expectPayload(r.json);
    });
  }
}
