
'use client';

export function LoadingCapsule() {
  return (
    <div className="loading-capsule">
      <div className="capsule-half left"></div>
      <div className="capsule-half right"></div>
    </div>
  );
}


export function PageLoader({ isLoading }: { isLoading: boolean }) {
    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <LoadingCapsule />
            <p className="mt-4 text-foreground font-semibold animate-pulse">Carregando...</p>
        </div>
    );
}
