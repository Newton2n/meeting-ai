"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  reset,
}: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error");
  }, []);

  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-md text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Something went wrong
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight">
              Unexpected error
            </h1>

            <p className="mt-4 text-muted-foreground">
              Something went wrong while loading the application. Please try
              again.
            </p>

            <div className="mt-8 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => reset()}
                className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Try Again
              </button>

              <Link
                href="/"
                className="rounded-md border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
