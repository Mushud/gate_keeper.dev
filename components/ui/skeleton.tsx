export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] ${className}`}
      style={{
        animation: "shimmer 2s infinite",
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="border border-zinc-200 rounded-lg p-6 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4 rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />
      </div>
      <Skeleton className="h-4 w-full rounded" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 w-20 rounded" />
        <Skeleton className="h-9 w-20 rounded" />
      </div>
    </div>
  );
}
