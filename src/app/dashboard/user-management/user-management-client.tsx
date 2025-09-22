'use client';

import { DataTable } from "@/components/ui/data-table";
import { getColumns } from "./columns";
import type { User } from "@/lib/types";

interface UserManagementClientProps {
    initialUsers: User[];
}

export function UserManagementClient({ initialUsers }: UserManagementClientProps) {
    const columns = getColumns();
    return (
        <DataTable columns={columns} data={initialUsers} filterColumn="email" />
    );
}
