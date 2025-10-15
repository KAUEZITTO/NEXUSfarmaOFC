
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
        <svg
            width="40"
            height="40"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-auto"
        >
          <g transform="rotate(45 50 50)">
            <path
              d="M50,15 a35,17.5 0 0,0 0,70"
              fill="hsl(var(--secondary))"
            />
            <path
              d="M50,15 a35,17.5 0 0,1 0,70"
              fill="hsl(var(--primary))"
            />
          </g>
        </svg>
    </div>
  );
}
