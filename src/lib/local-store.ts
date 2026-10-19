import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type Inquiry = {
  id: string;
  name: string;
  email: string;
  type: "general" | "partnership" | "academic" | "community";
  subject: string;
  message: string;
  status: "new" | "in_progress" | "closed";
  createdAt: string;
};

export type JoinRequest = {
  id: string;
  name: string;
  email: string;
  interest: "academic" | "community" | "both";
  motivation: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export type InitiativeRecord = {
  id: string;
  title: string;
  summary: string;
  track: "academic" | "community";
  status: "draft" | "published" | "archived";
  createdAt: string;
};

export type TeamRecord = {
  id: string;
  name: string;
  roleTitle: string;
  bio: string;
  isApproved: boolean;
  archivedAt: string | null;
  createdAt: string;
};

export type PartnerRecord = {
  id: string;
  name: string;
  summary: string;
  website: string;
  status: "draft" | "published" | "archived";
  createdAt: string;
};

export type LocalStore = {
  inquiries: Inquiry[];
  joinRequests: JoinRequest[];
  initiatives: InitiativeRecord[];
  team: TeamRecord[];
  partners: PartnerRecord[];
  siteStatus: "published" | "maintenance" | "temporarily_closed";
  audit: { id: string; action: string; createdAt: string }[];
};

const storePath = path.join(process.cwd(), ".local-data", "store.json");
const blankStore: LocalStore = {
  inquiries: [],
  joinRequests: [],
  initiatives: [],
  team: [],
  partners: [],
  siteStatus: "published",
  audit: [],
};
let pendingWrite = Promise.resolve();

export async function readStore(): Promise<LocalStore> {
  try {
    const contents = await readFile(storePath, "utf8");
    return { ...blankStore, ...JSON.parse(contents) } as LocalStore;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return structuredClone(blankStore);
  }
}

export async function updateStore(
  update: (store: LocalStore) => void,
): Promise<LocalStore> {
  let result!: LocalStore;
  const operation = pendingWrite.then(async () => {
    const store = await readStore();
    update(store);
    await mkdir(path.dirname(storePath), { recursive: true });
    const temporaryPath = `${storePath}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(store, null, 2), {
      encoding: "utf8",
      mode: 0o600,
    });
    await rename(temporaryPath, storePath);
    result = store;
  });
  pendingWrite = operation.catch(() => undefined);
  await operation;
  return result;
}

export function recordAudit(store: LocalStore, action: string): void {
  store.audit.unshift({
    id: crypto.randomUUID(),
    action,
    createdAt: new Date().toISOString(),
  });
  store.audit = store.audit.slice(0, 500);
}
