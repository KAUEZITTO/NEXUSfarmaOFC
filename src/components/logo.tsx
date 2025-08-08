import { cn } from '@/lib/utils';
import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-primary", className)}>
      <Image src="/logo.png" alt="NexusFarma Logo" width={32} height={32} />
      <h1 className="text-xl font-bold text-foreground">NexusFarma</h1>
    </div>
  );
}
