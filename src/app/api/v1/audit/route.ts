import { getDashboardData } from "@/domain/repository";
import { jsonOk } from "@/lib/api";

export async function GET() {
  const data = await getDashboardData();
  return jsonOk(data.audits);
}
