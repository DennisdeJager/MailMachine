import { AdminApp } from "@/components/AdminApp";
import { getDashboardData } from "@/domain/repository";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getDashboardData();
  return <AdminApp initialData={data} />;
}
