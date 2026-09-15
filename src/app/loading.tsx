export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="flex flex-col items-center text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />

        <p className="mt-4 text-sm font-medium">
          Loading...
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          Please wait while we load your meeting workspace.
        </p>
      </div>
    </main>
  );
}