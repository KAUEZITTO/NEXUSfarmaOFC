import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

// This component uses basic HTML tags and Tailwind CSS classes to avoid
// complex component dependencies that can cause prerender errors during build.
export default function LoadingNewOrderPage() {
    return (
        <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 animate-pulse">
            <div className="mx-auto grid w-full max-w-6xl flex-1 auto-rows-max gap-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-48" />
                    <div className="hidden items-center gap-2 md:ml-auto md:flex">
                        <Skeleton className="h-9 w-28" />
                        <Skeleton className="h-9 w-36" />
                    </div>
                </div>
                
                <div className="grid gap-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Card 1 */}
                        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                            <div className="flex flex-col space-y-1.5 p-6"><Skeleton className="h-6 w-40" /></div>
                            <div className="p-6 pt-0"><Skeleton className="h-10 w-full" /></div>
                        </div>
                        {/* Card 2 */}
                        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                            <div className="flex flex-col space-y-1.5 p-6"><Skeleton className="h-6 w-40" /></div>
                            <div className="p-6 pt-0 space-y-2">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full mt-2" />
                            </div>
                        </div>
                         {/* Card 3 */}
                        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                            <div className="flex flex-col space-y-1.5 p-6"><Skeleton className="h-6 w-40" /></div>
                            <div className="p-6 pt-0">
                              <div className="flex flex-wrap gap-2">
                                <Skeleton className="h-9 w-24" />
                                <Skeleton className="h-9 w-24" />
                                <Skeleton className="h-9 w-24" />
                              </div>
                            </div>
                        </div>
                        {/* Card 4 */}
                        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                            <div className="flex flex-col space-y-1.5 p-6"><Skeleton className="h-6 w-40" /></div>
                            <div className="p-6 pt-0">
                                <div className="space-y-2">
                                  <Skeleton className="h-10 w-full" />
                                  <Skeleton className="h-4 w-3/4 mt-1" />
                                </div>
                            </div>
                        </div>
                    </div>

                     {/* Main Content Card */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="flex flex-col space-y-1.5 p-6">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-full max-w-md mt-2" />
                        </div>
                        <div className="p-6 pt-0">
                            <div className="text-center h-24 text-muted-foreground flex items-center justify-center border rounded-md">
                                Carregando...
                            </div>
                        </div>
                    </div>

                    {/* Notes Card */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="flex flex-col space-y-1.5 p-6"><Skeleton className="h-6 w-40" /></div>
                        <div className="p-6 pt-0">
                            <Skeleton className="h-20 w-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
