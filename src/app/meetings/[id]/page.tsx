"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ActionItemTable } from "../../../components/meetings/action-item-table";
import { MeetingChat } from "../../../components/meetings/meeting-chat";
import { MeetingSections } from "../../../components/meetings/meeting-sections";

type ActionItem = {
  id: string;
  task: string;
  assignee: string | null;
  dueDate: string | null;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Meeting = {
  id: string;
  title: string;
  transcript: string;
  summary: string | null;
  keyDecisions: unknown;
  openQuestions: unknown;
  createdAt: string;
  actionItems: ActionItem[];
  chatMessages: ChatMessage[];
};

export default function MeetingPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [meeting, setMeeting] = useState<Meeting | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMeeting() {
      try {
        const response = await fetch(`/api/meetings/${id}`);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load meeting",
          );
        }

        setMeeting(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load meeting",
        );
      } finally {
        setLoading(false);
      }
    }

    loadMeeting();
  }, [id]);

  async function analyzeMeeting() {
    setAnalyzing(true);
    setError("");

    try {
      const response = await fetch(
        `/api/meetings/${id}/analyze`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to analyze meeting",
        );
      }

      setMeeting(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to analyze meeting",
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function deleteMeeting() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this meeting?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/meetings/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete meeting",
        );
      }

      router.push("/");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete meeting",
      );
    }
  }

  function updateActionItem(updated: ActionItem) {
    setMeeting((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        actionItems: current.actionItems.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      };
    });
  }

  function deleteActionItem(itemId: string) {
    setMeeting((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        actionItems: current.actionItems.filter(
          (item) => item.id !== itemId,
        ),
      };
    });
  }

  if (loading) {
    return <MeetingLoading />;
  }

  if (error || !meeting) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to meetings
          </Link>

          <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/10 p-6">
            <p className="text-sm text-destructive">
              {error || "Meeting not found"}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const createdDate = new Date(
    meeting.createdAt,
  ).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <header className="border-b pb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to meetings
            </Link>

            <button
              type="button"
              onClick={deleteMeeting}
              className="rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10"
            >
              Delete Meeting
            </button>
          </div>

          <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {meeting.title}
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                {createdDate}
              </p>
            </div>

            <button
              type="button"
              onClick={analyzeMeeting}
              disabled={analyzing}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {analyzing
                ? "Analyzing..."
                : meeting.summary
                  ? "Analyze Again"
                  : "Analyze with AI"}
            </button>
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">
                {error}
              </p>
            </div>
          )}
        </header>

        <div className="mt-8 space-y-8">
          <MeetingSections
            summary={meeting.summary}
            keyDecisions={meeting.keyDecisions}
            openQuestions={meeting.openQuestions}
          />

          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">
                Action Items
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Manage tasks extracted from this meeting.
              </p>
            </div>

            <ActionItemTable
              items={meeting.actionItems}
              onUpdated={updateActionItem}
              onDeleted={deleteActionItem}
            />
          </section>

          <section className="rounded-xl border bg-card p-6">
            <h2 className="text-lg font-semibold">
              Meeting Transcript
            </h2>

            <div className="mt-4 max-h-[400px] overflow-y-auto rounded-lg bg-muted/40 p-5">
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {meeting.transcript}
              </p>
            </div>
          </section>

          <MeetingChat
            meetingId={meeting.id}
            initialMessages={meeting.chatMessages}
          />
        </div>
      </div>
    </main>
  );
}

function MeetingLoading() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />

        <div className="mt-10 h-9 w-1/2 animate-pulse rounded bg-muted" />

        <div className="mt-8 space-y-6">
          <div className="h-40 animate-pulse rounded-xl bg-muted" />
          <div className="h-40 animate-pulse rounded-xl bg-muted" />
          <div className="h-40 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </main>
  );
}