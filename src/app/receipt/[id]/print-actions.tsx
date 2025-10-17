
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

export function PrintActions({ backOnly = false }: { backOnly?: boolean }) {
    const router = useRouter();

    // The automatic print dialog was causing issues.
    // It's better to let the user click the button.
    // useEffect(() => {
    //     if (!backOnly) {
    //         const timer = setTimeout(() => {
    //             window.print();
    //         }, 100);
    //         return () => clearTimeout(timer);
    //     }
    // }, [backOnly]);

    return (
        <div className="fixed bottom-4 right-4 flex gap-2 print:hidden">
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
            </Button>
            {!backOnly && (
                <Button onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir
                </Button>
            )}
        </div>
    );
}
