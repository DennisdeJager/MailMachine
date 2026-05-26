import { handleApiError, jsonOk, requireAdmin } from "@/lib/api";
import { audit, createMailbox, deleteById } from "@/domain/repository";
import { mailboxSchema } from "@/domain/validation";

export async function POST(request: Request) {
  try {
    const actor = requireAdmin(request);
    const payload = mailboxSchema.parse(await request.json());
    const mailbox = await createMailbox(payload);
    await audit(actor, "mailbox.create", "mailbox", mailbox.emailAddress, { folder: mailbox.folder });
    return jsonOk(mailbox, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = requireAdmin(request);
    const { id, name } = (await request.json()) as { id: string; name?: string };
    await deleteById("mailbox_connections", id);
    await audit(actor, "mailbox.delete", "mailbox", name ?? id);
    return jsonOk({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
