'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';

export function PrintActions() {
    const router = useRouter();

    useEffect(() => {
        // Automatically trigger print dialog when component mounts
        const timer = setTimeout(() => {
            window.print();
        }, 100); // Small delay to ensure content is rendered

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed bottom-4 right-4 flex gap-2 print:hidden">
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
            </Button>
            <Button onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
            </Button>
        </div>
    );
}
