export const permissions = [
  "dashboard.view",
  "members.view",
  "members.create",
  "members.update",
  "members.archive",
  "members.publish",
  "initiatives.view",
  "initiatives.create",
  "initiatives.update",
  "initiatives.publish",
  "initiatives.archive",
  "partners.view",
  "partners.publish",
  "partners.create",
  "partners.update",
  "partners.archive",
  "inquiries.view",
  "inquiries.respond",
  "inquiries.archive",
  "content.view",
  "content.update",
  "media.manage",
  "exports.create",
  "audit.view",
  "site.settings",
  "join_requests.review",
];

export const managerOnlyPermissions = [
  "dashboard.view",
  "members.create",
  "members.update",
  "members.archive",
  "members.publish",
  "initiatives.create",
  "initiatives.update",
  "initiatives.publish",
  "initiatives.archive",
  "partners.create",
  "partners.update",
  "partners.publish",
  "partners.archive",
  "inquiries.view",
  "inquiries.respond",
  "inquiries.archive",
  "content.view",
  "content.update",
  "media.manage",
  "exports.create",
  "audit.view",
  "site.settings",
  "join_requests.review",
];

export function canAccess(user, permission) {
  if (!user || !permissions.includes(permission)) return false;
  if (user.role === "manager") return true;
  if (user.role !== "coordinator" || !Array.isArray(user.permissions)) return false;
  if (managerOnlyPermissions.includes(permission)) return false;
  return user.permissions.includes(permission);
}

export function isAllowed(user, permission) {
  return canAccess(user, permission);
}
