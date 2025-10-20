
export default function LoadingNewDispensationPage() {
    return (
        <div className="mx-auto grid w-full max-w-6xl flex-1 auto-rows-max gap-6">
            <div className="flex items-center gap-4">
                <div className="h-8 w-64 rounded-md bg-muted" />
                <div className="hidden items-center gap-2 md:ml-auto md:flex">
                    <div className="h-9 w-28 rounded-md bg-muted" />
                    <div className="h-9 w-44 rounded-md bg-muted" />
                </div>
            </div>
            
            <div className="grid gap-6">
                 <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col space-y-1.5 p-6">
                        <div className="h-6 w-48 rounded-md bg-muted" />
                        <div className="h-4 w-full max-w-sm mt-2 rounded-md bg-muted" />
                    </div>
                    <div className="p-6 pt-0">
                        <div className="h-10 md:w-[400px] rounded-md bg-muted" />
                    </div>
                </div>
            </div>
        </div>
    );
}
