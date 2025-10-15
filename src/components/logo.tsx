
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative w-[140px] h-[40px]">
        <Image
          src="/NEXUS.png"
          alt="NexusFarma Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}
