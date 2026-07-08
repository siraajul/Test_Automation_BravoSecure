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
