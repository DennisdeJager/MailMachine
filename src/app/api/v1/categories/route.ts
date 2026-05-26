import { handleApiError, jsonOk, requireAdmin } from "@/lib/api";
import { audit, createCategory, deleteById } from "@/domain/repository";
import { categorySchema } from "@/domain/validation";

export async function POST(request: Request) {
  try {
    const actor = requireAdmin(request);
    const payload = categorySchema.parse(await request.json());
    const category = await createCategory(payload);
    await audit(actor, "category.create", "category", category.name, { color: category.color });
    return jsonOk(category, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = requireAdmin(request);
    const { id, name } = (await request.json()) as { id: string; name?: string };
    await deleteById("outlook_categories", id);
    await audit(actor, "category.delete", "category", name ?? id);
    return jsonOk({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
