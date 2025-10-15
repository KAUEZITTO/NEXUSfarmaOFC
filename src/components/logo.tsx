
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
                    d="M35,15 C20,15,20,35,35,35 L65,35 C80,35,80,15,65,15 Z"
                    fill="hsl(var(--primary))"
                />
                <path
                    d="M65,85 C80,85,80,65,65,65 L35,65 C20,65,20,85,35,85 Z"
                    fill="hsl(var(--secondary))"
                />
            </g>
        </svg>
    </div>
  );
}
