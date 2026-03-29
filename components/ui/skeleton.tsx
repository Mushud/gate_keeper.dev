export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded bg-zinc-100 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="border border-zinc-200 rounded-lg p-6 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3.5 w-1/3" />
      </div>
      <Skeleton className="h-3.5 w-full" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

export function ProjectsTableSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 overflow-hidden">
      <div className="border-b bg-zinc-50 px-4 py-3 flex gap-8">
        {["w-28", "w-20", "w-24", "w-32", "w-16", "w-20"].map((w, i) => (
          <Skeleton key={i} className={`h-3.5 ${w}`} />
        ))}
      </div>
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-8 px-4 py-4 border-b last:border-0"
        >
          <div className="space-y-1.5 min-w-[120px]">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="space-y-1.5 min-w-[80px]">
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-3 w-14" />
          </div>
          <div className="flex gap-1.5 min-w-[160px]">
            <Skeleton className="h-5 w-10 rounded-md" />
            <Skeleton className="h-5 w-10 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
          <div className="flex items-center gap-2 min-w-[180px]">
            <Skeleton className="h-7 flex-1 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-3.5 w-20" />
          <div className="flex gap-1.5 ml-auto">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
