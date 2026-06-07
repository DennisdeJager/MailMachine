import { getDashboardData } from "@/domain/repository";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const data = await getDashboardData();
    return jsonOk(data);
  } catch (error) {
    return handleApiError(error);
  }
}
