// tests/contract/_item-parameters-schema-check.mjs
//
// Subset JSON-Schema-draft-07 validator scoped to `corpus/item-parameters.schema.json`.
// NOT a general-purpose validator. Covers only the keywords used by that schema:
//   type (object|array|integer|number|string), required, properties, items
//   (single-schema form), enum, pattern (RegExp), minimum, maximum,
//   additionalProperties: false.
//
// Story 3.4 AC-10.5b: per architecture NFR33 — no third-party dev-deps. Precedent
// established by tests/contract/_state-schema-check.mjs (Story 3.2): hand-roll
// a minimal validator rather than vendor ajv (~50KB + supply-chain audit).
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
    // integer satisfies number
    if (schema.type === "number" && (actual === "integer" || actual === "number")) {
      // ok
    } else if (schema.type === "integer" && actual === "integer") {
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

  if (schema.maximum !== undefined && typeof value === "number" && value > schema.maximum) {
    errors.push(`${path}: value ${value} is above maximum ${schema.maximum}`);
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
        // underscore-prefixed keys are deferral-marker keys per Story 3.4 AC-0
        // (e.g. "_note"); skip them in additionalProperties enforcement so the
        // STUB marker survives validation. Real production schema for Story 9a-2
        // may revisit this convention.
        if (key.startsWith("_")) continue;
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

export function validateItemParameters(data, schema) {
  const errors = [];
  validateNode(data, schema, "$", errors);
  return { valid: errors.length === 0, errors };
}
