import { describe, expect, it } from "vitest";
import { classifyMessage } from "@/domain/classifier";
import type { MessageForClassification, Rule } from "@/domain/types";

const message: MessageForClassification = {
  id: "m1",
  sender: "billing@example.com",
  subject: "Nieuwe factuur mei",
  bodyPreview: "Bijgevoegd staat de factuur voor mei.",
  hasAttachments: true
};

const baseRule: Rule = {
  id: "r1",
  name: "Facturen",
  priority: 10,
  isActive: true,
  matchMode: "all",
  senderContains: "billing",
  subjectContains: "factuur",
  bodyContains: "",
  hasAttachments: true,
  categoryId: "c1",
  categoryName: "Factuur",
  stopProcessing: false
};

describe("classifyMessage", () => {
  it("matches active rules and returns Outlook category labels", () => {
    const result = classifyMessage(message, [baseRule]);

    expect(result.matchedRules).toHaveLength(1);
    expect(result.categoryNames).toEqual(["Factuur"]);
  });

  it("respects stopProcessing by priority", () => {
    const result = classifyMessage(message, [
      { ...baseRule, stopProcessing: true },
      { ...baseRule, id: "r2", categoryName: "Administratie", priority: 20 }
    ]);

    expect(result.categoryNames).toEqual(["Factuur"]);
  });

  it("ignores inactive rules", () => {
    const result = classifyMessage(message, [{ ...baseRule, isActive: false }]);

    expect(result.matchedRules).toHaveLength(0);
  });
});
