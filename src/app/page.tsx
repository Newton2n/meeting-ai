"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { MeetingCard } from "../components/meetings/meeting-card";

type Meeting = {
  id: string;
  title: string;
  createdAt: string;
  _count: {
    actionItems: number;
  };
};

export default function HomePage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMeetings() {
      try {
        const response = await fetch("/api/meetings");

        if (!response.ok) {
          throw new Error("Failed to load meetings");
        }

        const data = await response.json();

        setMeetings(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load meetings",
        );
      } finally {
        setLoading(false);
      }
    }

    loadMeetings();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 border-b pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">MeetingAI</p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Meetings
            </h1>

            <p className="mt-2 text-muted-foreground">
              Turn meeting conversations into actionable work.
            </p>
          </div>

          <Link
            href="/meetings/new"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            + New Meeting
          </Link>
        </header>

        <section className="mt-8">
          {loading && (
            <div className="space-y-4">
              <MeetingSkeleton />
              <MeetingSkeleton />
              <MeetingSkeleton />
            </div>
          )}

          {!loading && error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-5">
              <p className="text-sm text-destructive">{error}</p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-3 text-sm font-medium underline"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && meetings.length === 0 && (
            <div className="rounded-xl border border-dashed p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xl">
                +
              </div>

              <h2 className="mt-4 text-lg font-semibold">
                No meetings yet
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Create your first meeting and let AI extract the important
                information.
              </p>

              <Link
                href="/meetings/new"
                className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Create Meeting
              </Link>
            </div>
          )}

          {!loading && !error && meetings.length > 0 && (
            <div className="grid gap-4">
              {meetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function MeetingSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border p-6">
      <div className="h-5 w-1/3 rounded bg-muted" />
      <div className="mt-3 h-4 w-1/4 rounded bg-muted" />
      <div className="mt-6 h-4 w-1/2 rounded bg-muted" />
    </div>
  );
}