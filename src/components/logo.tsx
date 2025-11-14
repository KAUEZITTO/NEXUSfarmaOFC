
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-36 h-12", className)}>
      {/* Light mode logo */}
      <Image
        src="/NEXUSnv.png"
        alt="NexusFarma Logo"
        fill
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="block dark:hidden object-contain"
      />
      {/* Dark mode logo */}
      <Image
        src="/NEXUSnv-branco.png"
        alt="NexusFarma Logo"
        fill
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="hidden dark:block object-contain"
      />
    </div>
  );
}
