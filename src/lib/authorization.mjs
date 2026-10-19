export const permissions = [
  "dashboard.view",
  "members.view",
  "members.create",
  "members.update",
  "members.archive",
  "initiatives.view",
  "initiatives.create",
  "initiatives.update",
  "initiatives.publish",
  "initiatives.archive",
  "partners.view",
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
];

export function canAccess(user, permission) {
  if (!user || !permission) return false;
  if (user.role === "manager") return true;
  if (user.role !== "coordinator" || !Array.isArray(user.permissions)) return false;
  return user.permissions.includes(permission);
}

export function isAllowed(user, permission) {
  return canAccess(user, permission);
}
