
'use client';

import { Loader2 } from 'lucide-react';

export function PageLoader({ isLoading }: { isLoading: boolean }) {
    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="mt-4 text-foreground font-semibold animate-pulse">Carregando...</p>
        </div>
    );
}
