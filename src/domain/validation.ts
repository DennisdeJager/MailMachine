import { z } from "zod";

export const credentialSchema = z.object({
  name: z.string().min(2),
  tenantId: z.string().min(8),
  clientId: z.string().min(8),
  clientSecret: z.string().min(8),
  graphBaseUrl: z.string().url().default("https://graph.microsoft.com/v1.0"),
  authorityHost: z.string().url().default("https://login.microsoftonline.com")
});

export const mailboxSchema = z.object({
  name: z.string().min(2),
  emailAddress: z.string().email(),
  credentialId: z.string().uuid(),
  folder: z.string().min(1).default("Inbox"),
  pollingMinutes: z.coerce.number().int().min(1).max(1440).default(5)
});

export const categorySchema = z.object({
  name: z.string().min(2),
  color: z.string().min(2).default("preset0"),
  description: z.string().default("")
});

export const ruleSchema = z.object({
  name: z.string().min(2),
  priority: z.coerce.number().int().min(1).max(10000).default(100),
  matchMode: z.enum(["all", "any"]).default("all"),
  senderContains: z.string().default(""),
  subjectContains: z.string().default(""),
  bodyContains: z.string().default(""),
  hasAttachments: z.enum(["any", "true", "false"]).default("any").transform((value) => {
    if (value === "any") return null;
    return value === "true";
  }),
  categoryId: z.string().uuid(),
  stopProcessing: z.coerce.boolean().default(false)
}).refine(
  (value) => Boolean(value.senderContains || value.subjectContains || value.bodyContains || value.hasAttachments !== null),
  { message: "Minimaal een conditie is verplicht." }
);
