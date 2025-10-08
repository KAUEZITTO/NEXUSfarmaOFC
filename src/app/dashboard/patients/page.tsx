
import { getPatients } from "@/lib/data";
import { PatientsClient } from "./patients-client";
import type { PatientFilter } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  // Garantimos que sempre haverá um filtro padrão, mesmo que a URL não tenha.
  const filter = (searchParams?.filter as PatientFilter) || 'active';
  const initialPatients = await getPatients(filter);

  // Passamos os dados iniciais e o filtro para o componente cliente.
  return (
    <PatientsClient initialPatients={initialPatients} initialFilter={filter} />
  );
}
