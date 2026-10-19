import test from "node:test";
import assert from "node:assert/strict";
import { validateJoinApplication } from "./join-validation.mjs";

test("join application validation accepts and normalizes complete applications", () => {
  const result = validateJoinApplication({
    name: "  Sara  ",
    email: " SARA@EXAMPLE.COM ",
    interest: "academic",
    motivation: "I would like to contribute to thoughtful student-led initiatives.",
    consent: true,
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {
    name: "Sara",
    email: "sara@example.com",
    interest: "academic",
    motivation: "I would like to contribute to thoughtful student-led initiatives.",
  });
});

test("join application validation rejects missing consent and invalid fields", () => {
  assert.deepEqual(validateJoinApplication({}), { ok: false, error: "invalid_fields" });
  assert.equal(validateJoinApplication({
    name: "A",
    email: "not-an-email",
    interest: "manager",
    motivation: "Too short",
    consent: false,
  }).ok, false);
});
