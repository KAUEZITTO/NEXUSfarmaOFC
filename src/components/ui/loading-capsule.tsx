
'use client';

export function LoadingCapsule() {
    return (
        <div className="loading-capsule" role="status" aria-label="carregando">
            <div className="capsule-half left"></div>
            <div className="capsule-half right"></div>
        </div>
    )
}
