import { AdminApp } from "@/components/AdminApp";
import { getDashboardDataFromApi } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getDashboardDataFromApi();
  return <AdminApp initialData={data} />;
}
