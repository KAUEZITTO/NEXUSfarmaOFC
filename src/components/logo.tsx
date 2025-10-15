
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      {/* Light mode logo */}
      <Image
        src="/NEXUSnv.png"
        alt="NexusFarma Logo"
        width={140}
        height={40}
        priority
        className="dark:hidden"
      />
      {/* Dark mode logo */}
      <Image
        src="/NEXUSnv-branco.png"
        alt="NexusFarma Logo"
        width={140}
        height={40}
        priority
        className="hidden dark:block"
      />
    </div>
  );
}
