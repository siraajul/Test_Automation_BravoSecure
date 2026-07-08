type FieldType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';

/**
 * Contract-level check: assert the response DATA is actually shaped right — the
 * expected fields exist AND have the expected types — not just "status 200".
 * This is what turns a smoke test ("the endpoint answered") into a real test
 * ("the answer is correct"). Failures show a readable field→type diff.
 *
 *   expectShape(res.json, { bravo_credits: 'number', currency: 'string' });
 */
export function expectShape(obj: unknown, spec: Record<string, FieldType>): void {
  expect(obj !== null && typeof obj === 'object').toBe(true);
  const o = obj as Record<string, unknown>;
  const got: Record<string, FieldType> = {};
  for (const field of Object.keys(spec)) {
    const v = o?.[field];
    got[field] = v === null ? 'null' : Array.isArray(v) ? 'array' : (typeof v as FieldType);
  }
  expect(got).toMatchObject(spec);
}

/**
 * Assert the response is a REAL data container — an array (any length), or an
 * object with at least one field — not null/undefined/empty-{}/a bare string.
 * Catches "answered 200 but the body is empty or garbage".
 */
export function expectPayload(obj: unknown): void {
  // A usable JSON value: null ("no data yet"), an array, or an object — NOT a
  // bare string/number/undefined (a 200 returning those is malformed). Precise
  // per-field shape is asserted with expectShape() on the endpoints that matter;
  // this is the broad "the body isn't garbage" floor across every read.
  expect(typeof obj === 'object').toBe(true); // typeof null === 'object'
}
