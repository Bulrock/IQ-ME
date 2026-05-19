// tests/contract/_state-schema-check.mjs
//
// Subset JSON-Schema-2020-12 validator scoped to `src/assessment/state.schema.json` v1.
// NOT a general-purpose validator. Covers only the keywords used by state.schema.json:
//   type (object|array|integer|string), required, additionalProperties: false,
//   enum, pattern (RegExp), minimum, items (single-schema form).
//
// Story 3.2 Dev Notes Decision #1: vendoring `ajv` (~50KB + supply-chain audit) for
// one schema with seven keyword types is over-investment. If Epic 4 / Epic 5 add more
// schemas (e.g. methodology frontmatter), revisit vendoring at that point.
//
// Underscore-prefix marks this file as a sibling helper, NOT a spec file —
// node:test's `--test 'tests/contract/**/*.spec.mjs'` glob ignores it.

function typeOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  if (typeof value === "number") return "number";
  return typeof value;
}

function validateNode(value, schema, path, errors) {
  if (schema.type !== undefined) {
    const actual = typeOf(value);
    if (schema.type === "integer" && actual === "integer") {
      // ok
    } else if (schema.type !== actual) {
      errors.push(`${path}: type mismatch — expected ${schema.type}, got ${actual}`);
      return;
    }
  }

  if (schema.enum !== undefined && !schema.enum.includes(value)) {
    errors.push(`${path}: value ${JSON.stringify(value)} not in enum ${JSON.stringify(schema.enum)}`);
    return;
  }

  if (schema.pattern !== undefined && typeof value === "string") {
    const re = new RegExp(schema.pattern);
    if (!re.test(value)) {
      errors.push(`${path}: value ${JSON.stringify(value)} does not match pattern ${schema.pattern}`);
      return;
    }
  }

  if (schema.minimum !== undefined && typeof value === "number" && value < schema.minimum) {
    errors.push(`${path}: value ${value} is below minimum ${schema.minimum}`);
    return;
  }

  if (schema.type === "object" && typeOf(value) === "object") {
    if (Array.isArray(schema.required)) {
      for (const key of schema.required) {
        if (!Object.prototype.hasOwnProperty.call(value, key)) {
          errors.push(`${path}: missing required property "${key}"`);
        }
      }
    }
    if (schema.additionalProperties === false && schema.properties !== undefined) {
      const allowed = new Set(Object.keys(schema.properties));
      for (const key of Object.keys(value)) {
        if (!allowed.has(key)) {
          errors.push(`${path}: additional property "${key}" not allowed`);
        }
      }
    }
    if (schema.properties !== undefined) {
      for (const [key, subSchema] of Object.entries(schema.properties)) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          validateNode(value[key], subSchema, `${path}.${key}`, errors);
        }
      }
    }
  }

  if (schema.type === "array" && Array.isArray(value) && schema.items !== undefined) {
    for (let i = 0; i < value.length; i++) {
      validateNode(value[i], schema.items, `${path}[${i}]`, errors);
    }
  }
}

export function validateState(state, schema) {
  const errors = [];
  validateNode(state, schema, "$", errors);
  return { valid: errors.length === 0, errors };
}
