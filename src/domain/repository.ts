import { getDb } from "@/lib/db";
import { encryptSecret } from "@/lib/crypto";
import type { Category, Credential, DashboardData, Mailbox, Rule } from "./types";
import type postgres from "postgres";

const mapCredential = (row: Record<string, unknown>): Credential => ({
  id: String(row.id),
  name: String(row.name),
  tenantId: String(row.tenant_id),
  clientId: String(row.client_id),
  graphBaseUrl: String(row.graph_base_url),
  authorityHost: String(row.authority_host),
  status: String(row.status),
  lastVerifiedAt: row.last_verified_at ? String(row.last_verified_at) : null
});

const mapMailbox = (row: Record<string, unknown>): Mailbox => ({
  id: String(row.id),
  name: String(row.name),
  emailAddress: String(row.email_address),
  credentialId: String(row.credential_id),
  credentialName: String(row.credential_name ?? "Onbekend"),
  monitorEnabled: Boolean(row.monitor_enabled),
  folder: String(row.folder),
  pollingMinutes: Number(row.polling_minutes),
  status: String(row.status),
  lastCheckedAt: row.last_checked_at ? String(row.last_checked_at) : null
});

const mapCategory = (row: Record<string, unknown>): Category => ({
  id: String(row.id),
  name: String(row.name),
  color: String(row.color),
  description: String(row.description),
  isActive: Boolean(row.is_active)
});

const mapRule = (row: Record<string, unknown>): Rule => ({
  id: String(row.id),
  name: String(row.name),
  priority: Number(row.priority),
  isActive: Boolean(row.is_active),
  matchMode: row.match_mode === "any" ? "any" : "all",
  senderContains: String(row.sender_contains),
  subjectContains: String(row.subject_contains),
  bodyContains: String(row.body_contains),
  hasAttachments: row.has_attachments === null ? null : Boolean(row.has_attachments),
  categoryId: String(row.category_id),
  categoryName: String(row.category_name ?? ""),
  stopProcessing: Boolean(row.stop_processing)
});

export async function audit(actor: string, action: string, entityType: string, entityName: string, metadata: Record<string, unknown> = {}) {
  const db = getDb();
  await db`
    INSERT INTO audit_events (actor, action, entity_type, entity_name, metadata)
    VALUES (${actor}, ${action}, ${entityType}, ${entityName}, ${db.json(metadata as postgres.JSONValue)})
  `;
}

export async function getDashboardData(): Promise<DashboardData> {
  try {
    const db = getDb();
    const [credentials, mailboxes, categories, rules, audits] = await Promise.all([
      db`SELECT * FROM credential_vault ORDER BY created_at DESC`,
      db`
        SELECT m.*, c.name AS credential_name
        FROM mailbox_connections m
        JOIN credential_vault c ON c.id = m.credential_id
        ORDER BY m.created_at DESC
      `,
      db`SELECT * FROM outlook_categories ORDER BY name`,
      db`
        SELECT r.*, c.name AS category_name
        FROM classification_rules r
        JOIN outlook_categories c ON c.id = r.category_id
        ORDER BY r.priority ASC, r.name ASC
      `,
      db`SELECT id, actor, action, entity_type, entity_name, created_at FROM audit_events ORDER BY created_at DESC LIMIT 20`
    ]);

    return {
      credentials: credentials.map(mapCredential),
      mailboxes: mailboxes.map(mapMailbox),
      categories: categories.map(mapCategory),
      rules: rules.map(mapRule),
      audits: audits.map((row) => ({
        id: String(row.id),
        actor: String(row.actor),
        action: String(row.action),
        entityType: String(row.entity_type),
        entityName: String(row.entity_name),
        createdAt: String(row.created_at)
      })),
      dbReady: true
    };
  } catch (error) {
    return {
      credentials: [],
      mailboxes: [],
      categories: [],
      rules: [],
      audits: [],
      dbReady: false,
      dbError: error instanceof Error ? error.message : "Database is niet bereikbaar."
    };
  }
}

export async function listRules() {
  const db = getDb();
  const rows = await db`
    SELECT r.*, c.name AS category_name
    FROM classification_rules r
    JOIN outlook_categories c ON c.id = r.category_id
    ORDER BY r.priority ASC, r.name ASC
  `;
  return rows.map(mapRule);
}

export async function listActiveMailboxes() {
  const db = getDb();
  return db`
    SELECT m.*, c.name AS credential_name, c.tenant_id, c.client_id,
           c.encrypted_client_secret, c.graph_base_url, c.authority_host, c.status AS credential_status
    FROM mailbox_connections m
    JOIN credential_vault c ON c.id = m.credential_id
    WHERE m.monitor_enabled = true
    ORDER BY m.name ASC
  `;
}

export async function upsertCredential(input: {
  name: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  graphBaseUrl: string;
  authorityHost: string;
}) {
  const db = getDb();
  const [row] = await db`
    INSERT INTO credential_vault (name, tenant_id, client_id, encrypted_client_secret, graph_base_url, authority_host, status)
    VALUES (${input.name}, ${input.tenantId}, ${input.clientId}, ${encryptSecret(input.clientSecret)}, ${input.graphBaseUrl}, ${input.authorityHost}, 'configured')
    ON CONFLICT (name) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id,
      client_id = EXCLUDED.client_id,
      encrypted_client_secret = EXCLUDED.encrypted_client_secret,
      graph_base_url = EXCLUDED.graph_base_url,
      authority_host = EXCLUDED.authority_host,
      status = 'configured',
      updated_at = now()
    RETURNING *
  `;
  return mapCredential(row);
}

export async function createMailbox(input: {
  name: string;
  emailAddress: string;
  credentialId: string;
  folder: string;
  pollingMinutes: number;
}) {
  const db = getDb();
  const [row] = await db`
    INSERT INTO mailbox_connections (name, email_address, credential_id, folder, polling_minutes, status)
    VALUES (${input.name}, ${input.emailAddress}, ${input.credentialId}, ${input.folder}, ${input.pollingMinutes}, 'active')
    RETURNING *, '' AS credential_name
  `;
  return mapMailbox(row);
}

export async function createCategory(input: { name: string; color: string; description: string }) {
  const db = getDb();
  const [row] = await db`
    INSERT INTO outlook_categories (name, color, description)
    VALUES (${input.name}, ${input.color}, ${input.description})
    RETURNING *
  `;
  return mapCategory(row);
}

export async function createRule(input: {
  name: string;
  priority: number;
  matchMode: "all" | "any";
  senderContains: string;
  subjectContains: string;
  bodyContains: string;
  hasAttachments: boolean | null;
  categoryId: string;
  stopProcessing: boolean;
}) {
  const db = getDb();
  const [row] = await db`
    INSERT INTO classification_rules
      (name, priority, match_mode, sender_contains, subject_contains, body_contains, has_attachments, category_id, stop_processing)
    VALUES
      (${input.name}, ${input.priority}, ${input.matchMode}, ${input.senderContains}, ${input.subjectContains}, ${input.bodyContains}, ${input.hasAttachments}, ${input.categoryId}, ${input.stopProcessing})
    RETURNING *, '' AS category_name
  `;
  return mapRule(row);
}

export async function deleteById(table: "mailbox_connections" | "classification_rules" | "outlook_categories" | "credential_vault", id: string) {
  const db = getDb();
  await db`DELETE FROM ${db(table)} WHERE id = ${id}`;
}
