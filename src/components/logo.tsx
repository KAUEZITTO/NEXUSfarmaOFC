
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-36 h-10", className)}>
      {/* Light mode logo */}
      <Image
        src="/NEXUSnv.png"
        alt="NexusFarma Logo"
        fill
        style={{ objectFit: 'contain' }}
        priority
        className="block dark:hidden"
      />
      {/* Dark mode logo */}
      <Image
        src="/NEXUSnv-branco.png"
        alt="NexusFarma Logo"
        fill
        style={{ objectFit: 'contain' }}
        priority
        className="hidden dark:block"
      />
    </div>
  );
}
