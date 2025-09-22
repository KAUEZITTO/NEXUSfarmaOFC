
'use client';

import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import type { Unit } from "@/lib/types";
import { columns } from "./columns";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface OrdersClientProps {
    units: Unit[];
}

export function OrdersClient({ units }: OrdersClientProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUnits = units.filter(unit => 
    unit.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Input
          placeholder="Filtrar por nome da unidade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button asChild>
          <Link href="/dashboard/orders/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Remessa
          </Link>
        </Button>
      </div>
      <DataTable columns={columns} data={filteredUnits} filterColumn="name" />
    </div>
  );
}
