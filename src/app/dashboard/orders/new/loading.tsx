// Este componente usa apenas tags HTML básicas e classes Tailwind para
// garantir que não haja erros de pré-renderização durante o build do Next.js.
export default function LoadingNewOrderPage() {
    return (
        <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 animate-pulse">
            <div className="mx-auto grid w-full max-w-6xl flex-1 auto-rows-max gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-8 w-48 rounded-md bg-muted" />
                    <div className="hidden items-center gap-2 md:ml-auto md:flex">
                        <div className="h-9 w-28 rounded-md bg-muted" />
                        <div className="h-9 w-36 rounded-md bg-muted" />
                    </div>
                </div>
                
                <div className="grid gap-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Card 1 */}
                        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                            <div className="flex flex-col space-y-1.5 p-6"><div className="h-6 w-40 rounded-md bg-muted" /></div>
                            <div className="p-6 pt-0"><div className="h-10 w-full rounded-md bg-muted" /></div>
                        </div>
                        {/* Card 2 */}
                        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                            <div className="flex flex-col space-y-1.5 p-6"><div className="h-6 w-40 rounded-md bg-muted" /></div>
                            <div className="p-6 pt-0 space-y-4">
                                <div className="h-10 w-full rounded-md bg-muted" />
                                <div className="h-10 w-full rounded-md bg-muted" />
                            </div>
                        </div>
                         {/* Card 3 */}
                        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                            <div className="flex flex-col space-y-1.5 p-6"><div className="h-6 w-40 rounded-md bg-muted" /></div>
                            <div className="p-6 pt-0">
                              <div className="flex flex-wrap gap-2">
                                <div className="h-9 w-24 rounded-full bg-muted" />
                                <div className="h-9 w-24 rounded-full bg-muted" />
                                <div className="h-9 w-24 rounded-full bg-muted" />
                              </div>
                            </div>
                        </div>
                        {/* Card 4 */}
                        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                            <div className="flex flex-col space-y-1.5 p-6"><div className="h-6 w-40 rounded-md bg-muted" /></div>
                            <div className="p-6 pt-0">
                                <div className="space-y-2">
                                  <div className="h-10 w-full rounded-md bg-muted" />
                                  <div className="h-4 w-3/4 mt-1 rounded-md bg-muted" />
                                </div>
                            </div>
                        </div>
                    </div>

                     {/* Main Content Card */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="flex flex-col space-y-1.5 p-6">
                            <div className="h-6 w-48 rounded-md bg-muted" />
                            <div className="h-4 w-full max-w-md mt-2 rounded-md bg-muted" />
                        </div>
                        <div className="p-6 pt-0">
                            <div className="text-center h-24 text-muted-foreground flex items-center justify-center border rounded-md">
                                Carregando...
                            </div>
                        </div>
                    </div>

                    {/* Notes Card */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="flex flex-col space-y-1.5 p-6"><div className="h-6 w-40 rounded-md bg-muted" /></div>
                        <div className="p-6 pt-0">
                            <div className="h-20 w-full rounded-md bg-muted" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
