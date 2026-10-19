import test from "node:test";
import assert from "node:assert/strict";
import { canAccess } from "./authorization.mjs";

test("authorization denies missing identities and permissions by default", () => {
  assert.equal(canAccess(null, "dashboard.view"), false);
  assert.equal(canAccess({ role: "visitor" }, "dashboard.view"), false);
  assert.equal(canAccess({ role: "coordinator" }, "dashboard.view"), false);
});

test("coordinators receive only explicitly assigned permissions", () => {
  const coordinator = { role: "coordinator", permissions: ["initiatives.view"] };
  assert.equal(canAccess(coordinator, "initiatives.view"), true);
  assert.equal(canAccess(coordinator, "inquiries.view"), false);
});

test("manager permissions are unrestricted only for an identified manager", () => {
  assert.equal(canAccess({ role: "manager" }, "site.settings"), true);
  assert.equal(canAccess({ role: "coordinator" }, "site.settings"), false);
});
