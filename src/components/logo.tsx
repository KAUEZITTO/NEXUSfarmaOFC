
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-[140px] h-[40px]", className)}>
      <Image
        src="/NEXUSnv.png"
        alt="NexusFarma Logo"
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        style={{ objectFit: 'contain' }}
        priority
      />
    </div>
  );
}
