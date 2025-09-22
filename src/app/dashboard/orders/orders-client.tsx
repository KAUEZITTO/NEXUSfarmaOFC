'use client';

import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import type { Unit } from "@/lib/types";
import { columns } from "./columns";

interface OrdersClientProps {
    initialUnits: Unit[];
}

export function OrdersClient({ initialUnits }: OrdersClientProps) {

  return (
    <div>
        <div className="flex justify-end mb-4">
            <Button asChild>
                <Link href="/dashboard/orders/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Remessa
                </Link>
            </Button>
        </div>
        <DataTable columns={columns} data={initialUnits} filterColumn="name" />
    </div>
  );
}
