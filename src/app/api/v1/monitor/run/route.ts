import { classifyMessage } from "@/domain/classifier";
import { applyOutlookCategories, fetchRecentMessages } from "@/domain/graph";
import { audit, listActiveMailboxes, listRules } from "@/domain/repository";
import { getDb } from "@/lib/db";
import { handleApiError, jsonOk, requireAdmin } from "@/lib/api";
import type { Credential } from "@/domain/types";

export async function POST(request: Request) {
  try {
    const actor = requireAdmin(request);
    const db = getDb();
    const rules = await listRules();
    const mailboxes = await listActiveMailboxes();
    const results: Array<{ mailbox: string; processed: number; categorized: number; errors: number }> = [];

    for (const mailbox of mailboxes) {
      let processed = 0;
      let categorized = 0;
      let errors = 0;
      const credential: Credential & { encryptedClientSecret: string } = {
        id: String(mailbox.credential_id),
        name: String(mailbox.credential_name),
        tenantId: String(mailbox.tenant_id),
        clientId: String(mailbox.client_id),
        encryptedClientSecret: String(mailbox.encrypted_client_secret),
        graphBaseUrl: String(mailbox.graph_base_url),
        authorityHost: String(mailbox.authority_host),
        status: String(mailbox.credential_status),
        lastVerifiedAt: null
      };

      const messages = await fetchRecentMessages({
        credential,
        mailboxAddress: String(mailbox.email_address),
        folder: String(mailbox.folder),
        limit: 25
      });

      for (const message of messages) {
        processed += 1;
        const result = classifyMessage(message, rules);
        if (result.categoryNames.length === 0) continue;

        try {
          await applyOutlookCategories({
            credential,
            mailboxAddress: String(mailbox.email_address),
            messageId: message.id,
            categories: result.categoryNames
          });
          categorized += 1;
          await db`
            INSERT INTO classified_messages
              (mailbox_id, graph_message_id, internet_message_id, subject, sender, matched_rule_ids, applied_category_names, status)
            VALUES
              (${String(mailbox.id)}, ${message.id}, ${message.internetMessageId ?? ""}, ${message.subject}, ${message.sender}, ${result.matchedRules.map((rule) => rule.id)}, ${result.categoryNames}, 'categorized')
            ON CONFLICT (mailbox_id, graph_message_id) DO UPDATE SET
              matched_rule_ids = EXCLUDED.matched_rule_ids,
              applied_category_names = EXCLUDED.applied_category_names,
              status = 'categorized',
              classified_at = now(),
              error_message = null
          `;
        } catch (error) {
          errors += 1;
          await db`
            INSERT INTO classified_messages
              (mailbox_id, graph_message_id, subject, sender, matched_rule_ids, applied_category_names, status, error_message)
            VALUES
              (${String(mailbox.id)}, ${message.id}, ${message.subject}, ${message.sender}, ${result.matchedRules.map((rule) => rule.id)}, ${result.categoryNames}, 'error', ${error instanceof Error ? error.message : "Onbekende fout"})
            ON CONFLICT (mailbox_id, graph_message_id) DO UPDATE SET
              status = 'error',
              error_message = EXCLUDED.error_message,
              classified_at = now()
          `;
        }
      }

      await db`UPDATE mailbox_connections SET last_checked_at = now(), status = ${errors > 0 ? "warning" : "active"} WHERE id = ${String(mailbox.id)}`;
      results.push({ mailbox: String(mailbox.email_address), processed, categorized, errors });
    }

    await audit(actor, "monitor.run", "monitor", "manual", { results });
    return jsonOk({ results });
  } catch (error) {
    return handleApiError(error);
  }
}
