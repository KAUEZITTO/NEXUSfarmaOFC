
import { getUnits } from "@/lib/data";
import { UnitsClient } from './units-client';

export default async function UnitsPage() {
  const initialUnits = await getUnits();

  return (
    <UnitsClient initialUnits={initialUnits} />
  );
}
