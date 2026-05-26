import { handleApiError, jsonOk, requireAdmin } from "@/lib/api";
import { audit, createRule, deleteById } from "@/domain/repository";
import { ruleSchema } from "@/domain/validation";

export async function POST(request: Request) {
  try {
    const actor = requireAdmin(request);
    const payload = ruleSchema.parse(await request.json());
    const rule = await createRule(payload);
    await audit(actor, "rule.create", "rule", rule.name, { priority: rule.priority });
    return jsonOk(rule, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = requireAdmin(request);
    const { id, name } = (await request.json()) as { id: string; name?: string };
    await deleteById("classification_rules", id);
    await audit(actor, "rule.delete", "rule", name ?? id);
    return jsonOk({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
