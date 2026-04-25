export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center px-4 md:px-6">
      <div className="relative h-10 w-10">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
        <span className="absolute inset-2 rounded-full bg-primary" />
      </div>
      <p className="mt-6 text-[13px] text-text-muted">불러오는 중...</p>
    </div>
  );
}
