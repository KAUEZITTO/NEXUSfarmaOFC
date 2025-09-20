
import { getPatients } from "@/lib/actions";
import { PatientsClient } from "./patients-client";

// A diretiva 'force-dynamic' garante que a página sempre busque os dados mais recentes.
export const dynamic = 'force-dynamic';

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
