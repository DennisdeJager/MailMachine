import { handleApiError, jsonOk, requireAdmin } from "@/lib/api";
import { audit, deleteById, upsertCredential } from "@/domain/repository";
import { credentialSchema } from "@/domain/validation";

export async function POST(request: Request) {
  try {
    const actor = requireAdmin(request);
    const payload = credentialSchema.parse(await request.json());
    const credential = await upsertCredential(payload);
    await audit(actor, "credential.upsert", "credential", credential.name, { tenantId: credential.tenantId });
    return jsonOk(credential, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = requireAdmin(request);
    const { id, name } = (await request.json()) as { id: string; name?: string };
    await deleteById("credential_vault", id);
    await audit(actor, "credential.delete", "credential", name ?? id);
    return jsonOk({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
