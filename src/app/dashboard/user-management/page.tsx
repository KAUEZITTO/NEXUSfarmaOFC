
import { getAllUsers } from "@/lib/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserManagementClient } from "./user-management-client";

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
        <UserManagementClient initialUsers={users} />
      </CardContent>
    </Card>
  );
}
