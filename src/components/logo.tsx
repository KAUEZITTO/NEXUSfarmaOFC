import { Boxes } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-primary", className)}>
      <Boxes className="h-7 w-7" />
      <h1 className="text-xl font-bold text-foreground">EstoqueLink</h1>
    </div>
  );
}
