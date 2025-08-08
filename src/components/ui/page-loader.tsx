
'use client';

import { LoadingCapsule } from "./loading-capsule";

export function PageLoader({ isLoading }: { isLoading: boolean }) {
    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
            <LoadingCapsule />
            <p className="mt-4 text-white font-semibold animate-pulse">Carregando...</p>
        </div>
    );
}
