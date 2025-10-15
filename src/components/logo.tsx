
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src="/NEXUS.png"
        alt="NexusFarma Logo"
        width={140}
        height={40}
        className="object-contain"
        priority
      />
    </div>
  );
}
