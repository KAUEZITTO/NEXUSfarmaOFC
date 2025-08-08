import { cn } from '@/lib/utils';
import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image src="/NEXUS.png" alt="NexusFarma Logo" width={32} height={32} className="dark:hidden" />
      <Image src="/NEXUS-BRANCO.png" alt="NexusFarma Logo" width={32} height={32} className="hidden dark:block" />
      <h1 className="text-xl font-bold text-foreground">NexusFarma</h1>
    </div>
  );
}
