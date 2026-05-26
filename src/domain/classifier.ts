import type { MessageForClassification, Rule } from "./types";

export type ClassificationResult = {
  matchedRules: Rule[];
  categoryNames: string[];
};

function includes(haystack: string, needle: string) {
  if (!needle.trim()) return null;
  return haystack.toLowerCase().includes(needle.trim().toLowerCase());
}

export function classifyMessage(message: MessageForClassification, rules: Rule[]): ClassificationResult {
  const matchedRules: Rule[] = [];
  const categoryNames = new Set<string>();

  for (const rule of [...rules].sort((a, b) => a.priority - b.priority)) {
    if (!rule.isActive) continue;

    const checks = [
      includes(message.sender, rule.senderContains),
      includes(message.subject, rule.subjectContains),
      includes(message.bodyPreview, rule.bodyContains),
      rule.hasAttachments === null ? null : message.hasAttachments === rule.hasAttachments
    ].filter((value): value is boolean => value !== null);

    const matched = checks.length > 0 && (rule.matchMode === "all" ? checks.every(Boolean) : checks.some(Boolean));

    if (matched) {
      matchedRules.push(rule);
      categoryNames.add(rule.categoryName);
      if (rule.stopProcessing) break;
    }
  }

  return { matchedRules, categoryNames: [...categoryNames] };
}
