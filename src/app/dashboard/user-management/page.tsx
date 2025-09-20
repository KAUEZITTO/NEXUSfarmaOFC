
'use server';

import { getAllUsers } from "@/lib/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";

export default async function UserManagementPage() {
  const users = await getAllUsers();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Usuários</CardTitle>
        <CardDescription>
          Visualize e gerencie os usuários cadastrados no sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={users} filterColumn="email" />
      </CardContent>
    </Card>
  );
}
