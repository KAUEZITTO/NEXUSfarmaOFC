
'use client';

import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import type { User } from "@/lib/types";

interface UserManagementClientProps {
    initialUsers: User[];
}

export function UserManagementClient({ initialUsers }: UserManagementClientProps) {
    return (
        <DataTable columns={columns} data={initialUsers} filterColumn="email" />
    );
}
