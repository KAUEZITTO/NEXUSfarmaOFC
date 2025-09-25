
import { getPatients } from "@/lib/data";
import { PatientsClient } from "./patients-client";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const filter = searchParams?.filter || 'active';
  const initialPatients = await getPatients(filter as any);

  return (
    <PatientsClient initialPatients={initialPatients} initialFilter={filter as any} />
  );
}
