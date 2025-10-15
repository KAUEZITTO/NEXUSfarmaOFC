import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
                        <Card>
                            <CardHeader><CardTitle><Skeleton className="h-6 w-40" /></CardTitle></CardHeader>
                            <CardContent><Skeleton className="h-10 w-full" /></CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle><Skeleton className="h-6 w-40" /></CardTitle></CardHeader>
                            <CardContent>
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-4 w-3/4 mt-2" />
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle><Skeleton className="h-6 w-40" /></CardTitle></CardHeader>
                            <CardContent><Skeleton className="h-10 w-full" /></CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle><Skeleton className="h-6 w-40" /></CardTitle></CardHeader>
                            <CardContent>
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-4 w-1/2 mt-2" />
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-full max-w-md mt-2" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-center h-24 text-muted-foreground flex items-center justify-center border rounded-md">
                                Carregando...
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle><Skeleton className="h-6 w-40" /></CardTitle></CardHeader>
                        <CardContent>
                            <Skeleton className="h-20 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
