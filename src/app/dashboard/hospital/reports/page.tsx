
'use server'; // Convertido para Server Component para buscar a sessão no servidor

import { generateHospitalStockReportPDF, generateHospitalEntriesAndExitsReportPDF, generateHospitalSectorDispensationReportPDF } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth"; // Usar nossa função de auth
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { HospitalReportsClientPage } from "./client-page";

export default async function HospitalReportsPage() {
  const user = await getCurrentUser();

  // Acesso permitido se a localização for 'Hospital' OU se o usuário for Coordenador
  if (user?.location !== 'Hospital' && user?.subRole !== 'Coordenador') {
      return (
          <div className="flex items-center justify-center h-full">
              <p className="text-destructive">Acesso negado a esta área.</p>
          </div>
      );
  }

  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <HospitalReportsClientPage />
    </Suspense>
  );
}
