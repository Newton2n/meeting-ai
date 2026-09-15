import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Error 404
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Page not found
        </h1>

        <p className="mt-4 text-muted-foreground">
          The meeting or page you are looking for does not
          exist or may have been moved.
        </p>

        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}