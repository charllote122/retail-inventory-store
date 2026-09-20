export function SkeletonCard() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 animate-pulse overflow-hidden">
            <div className="h-52 bg-slate-200"></div>
            <div className="p-4 space-y-3">
                <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                <div className="flex items-center justify-between pt-2">
                    <div className="h-5 bg-slate-200 rounded w-16"></div>
                    <div className="h-8 bg-slate-200 rounded w-14"></div>
                </div>
            </div>
        </div>
    )
}

export function SkeletonGrid({ count = 8 }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    )
}

export function SkeletonRow() {
    return (
        <div className="flex items-center gap-4 p-4 border-b animate-pulse">
            <div className="w-12 h-12 bg-slate-200 rounded"></div>
            <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                <div className="h-3 bg-slate-200 rounded w-1/4"></div>
            </div>
            <div className="h-4 bg-slate-200 rounded w-16"></div>
        </div>
    )
}