

import { Suspense } from 'react';
import { UserManagementClientPage } from './client-page';
import { getAllUsers } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function UserManagementSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Usuários</CardTitle>
        <CardDescription>
          Visualize e gerencie os usuários cadastrados no sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mt-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default async function UserManagementPage() {
  const users = await getAllUsers();
  return (
    <Suspense fallback={<UserManagementSkeleton />}>
      <UserManagementClientPage initialUsers={users} />
    </Suspense>
  );
}
