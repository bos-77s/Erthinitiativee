import test from "node:test";
import assert from "node:assert/strict";
import { canAccess, managerOnlyPermissions, permissions } from "./authorization.mjs";

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

test("only catalogued permissions are granted, including to managers", () => {
  assert.equal(canAccess({ role: "manager" }, "site.settings"), true);
  assert.equal(canAccess({ role: "manager" }, "site.setting"), false);
  assert.equal(canAccess({ role: "manager" }, "join_requests.review"), true);
  assert.equal(canAccess({ role: "manager" }, "unknown.permission"), false);
});

test("manager-only permissions reject coordinators even when explicitly assigned", () => {
  const coordinator = { role: "coordinator", permissions: [...managerOnlyPermissions] };
  for (const permission of managerOnlyPermissions) {
    assert.equal(canAccess(coordinator, permission), false, `${permission} must be manager-only`);
  }
});

test("manager-only policy covers sensitive administration decisions", () => {
  const requiredManagerPermissions = [
    "dashboard.view",
    "inquiries.respond",
    "inquiries.archive",
    "content.update",
    "initiatives.publish",
    "partners.update",
    "partners.publish",
    "members.publish",
    "join_requests.review",
    "site.settings",
    "exports.create",
  ];

  for (const permission of requiredManagerPermissions) {
    assert.ok(permissions.includes(permission), `${permission} must be catalogued`);
    assert.ok(managerOnlyPermissions.includes(permission), `${permission} must be manager-only`);
  }
});
