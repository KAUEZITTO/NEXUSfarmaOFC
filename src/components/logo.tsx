
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-primary"
        >
            <path d="M12 2v20" />
            <path d="M2 12h20" />
            <path d="M18.7 5.3a8 8 0 0 1-13.4 0" />
            <path d="M5.3 18.7a8 8 0 0 1 13.4 0" />
        </svg>
      <h1 className="text-xl font-bold text-foreground">NexusFarma</h1>
    </div>
  );
}
