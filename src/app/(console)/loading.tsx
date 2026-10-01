const Loading = () => (
  <div role="status" aria-live="polite" className="space-y-4">
    <span className="sr-only">Loading</span>
    <div className="h-4 w-40 animate-pulse rounded bg-raised" />
    <div className="h-10 w-80 max-w-full animate-pulse rounded bg-raised" />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map(index => (
        <div key={index} className="h-36 animate-pulse rounded-xl bg-surface" />
      ))}
    </div>
    <div className="h-72 animate-pulse rounded-xl bg-surface" />
  </div>
);

export default Loading;
