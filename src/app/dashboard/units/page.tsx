
import { getUnits } from "@/lib/data";
import { UnitsClient } from './units-client';

export const dynamic = "force-dynamic";

export default async function UnitsPage() {
  const initialUnits = await getUnits();

  return (
    <UnitsClient initialUnits={initialUnits} />
  );
}
