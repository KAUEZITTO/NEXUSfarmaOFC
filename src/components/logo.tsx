
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Image
        src="/NEXUSnv.png"
        alt="NexusFarma Logo"
        width={140}
        height={40}
        priority
      />
    </div>
  );
}
