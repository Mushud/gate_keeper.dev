export default function Loading() {
  return (
    <div className="p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-zinc-200 rounded w-1/4"></div>
        <div className="h-4 bg-zinc-200 rounded w-1/2"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          <div className="h-32 bg-zinc-200 rounded"></div>
          <div className="h-32 bg-zinc-200 rounded"></div>
          <div className="h-32 bg-zinc-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}
