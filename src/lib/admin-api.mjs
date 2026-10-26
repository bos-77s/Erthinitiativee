import { canAccess } from "./authorization.mjs";

const sections = {
  overview: {
    permission: "dashboard.view",
    project: (store) => ({
      summary: {
        inquiryCount: store.inquiries.length,
        publishedInitiativeCount: store.initiatives.filter((item) => item.status === "published").length,
        publishedTeamCount: store.team.filter((member) => member.isApproved && member.archivedAt === null).length,
        publishedPartnerCount: store.partners.filter((partner) => partner.status === "published").length,
      },
    }),
  },
  inquiries: {
    permission: "inquiries.view",
    project: (store) => ({
      inquiries: store.inquiries.map(({ id, name, email, type, subject, message, status, createdAt }) => ({
        id, name, email, type, subject, message, status, createdAt,
      })),
    }),
  },
  requests: {
    permission: "join_requests.review",
    project: (store) => ({
      joinRequests: store.joinRequests.map(({ id, name, email, interest, motivation, status, createdAt }) => ({
        id, name, email, interest, motivation, status, createdAt,
      })),
    }),
  },
  initiatives: {
    permission: "initiatives.view",
    project: (store, user) => {
      const records = user.role === "manager"
        ? store.initiatives
        : store.initiatives.filter((item) => item.status === "published");
      return {
        initiatives: records.map(({ id, title, summary, track, status, createdAt }) => ({
          id, title, summary, track, status, createdAt,
        })),
      };
    },
  },
  members: {
    permission: "members.view",
    project: (store, user) => {
      const records = user.role === "manager"
        ? store.team
        : store.team.filter((member) => member.isApproved && member.archivedAt === null);
      return {
        team: records.map(({ id, name, roleTitle, bio, isApproved, archivedAt, createdAt }) => ({
          id, name, roleTitle, bio, isApproved, archivedAt, createdAt,
        })),
      };
    },
  },
  partners: {
    permission: "partners.view",
    project: (store, user) => {
      const records = user.role === "manager"
        ? store.partners
        : store.partners.filter((partner) => partner.status === "published");
      return {
        partners: records.map(({ id, name, summary, website, status, createdAt }) => ({
          id, name, summary, website, status, createdAt,
        })),
      };
    },
  },
  settings: {
    permission: "site.settings",
    project: (store) => ({ siteStatus: store.siteStatus }),
  },
  audit: {
    permission: "audit.view",
    project: (store) => ({
      audit: store.audit.map(({ id, action, createdAt }) => ({ id, action, createdAt })),
    }),
  },
};

const actionPermissions = {
  "inquiry-status": "inquiries.respond",
  "site-status": "site.settings",
  "initiative-status": "initiatives.update",
  "team-status": "members.publish",
  "partner-status": "partners.publish",
  "join-request-status": "join_requests.review",
  "export-inquiries": "exports.create",
  "create-initiative": "initiatives.create",
  "create-team-member": "members.create",
  "create-partner": "partners.create",
  "update-initiative": "initiatives.update",
  "update-team-member": "members.update",
  "update-partner": "partners.update",
};

export async function readAdminSection(user, section, readStore) {
  if (typeof section !== "string" || !Object.hasOwn(sections, section)) {
    return { ok: false, status: 400, error: "unknown_section" };
  }

  const sectionConfig = sections[section];
  if (!canAccess(user, sectionConfig.permission)) {
    return { ok: false, status: 401, error: "unauthorized" };
  }

  const store = await readStore();
  return {
    ok: true,
    section,
    data: sectionConfig.project(store, user),
  };
}

export function authorizeAdminAction(user, action) {
  if (typeof action !== "string" || !Object.hasOwn(actionPermissions, action)) {
    return { ok: false, status: 400, error: "unsupported_action" };
  }

  if (!canAccess(user, actionPermissions[action])) {
    return { ok: false, status: 401, error: "unauthorized" };
  }

  return { ok: true, permission: actionPermissions[action] };
}
