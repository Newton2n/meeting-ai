"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ActionItemTable } from "../../../components/meetings/action-item-table";
import { MeetingChat } from "../../../components/meetings/meeting-chat";
import { MeetingSections } from "../../../components/meetings/meeting-sections";

type ActionItem = {
  id: string;
  task: string;
  assignee: string | null;
  dueDate: string | null;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
};

type ChatMessage = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

type Meeting = {
  id: string;
  title: string;
  transcript: string;
  summary: string | null;
  keyDecisions: unknown;
  openQuestions: unknown;
  createdAt: string;
  updatedAt: string;
  actionItems: ActionItem[];
  chatMessages: ChatMessage[];
};

export default function MeetingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [meetingId, setMeetingId] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    async function loadMeeting() {
      try {
        const { id } = await params;
        setMeetingId(id);

        const response = await fetch(`/api/meetings/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch meeting");
        }

        setMeeting({
          ...data,
          actionItems: data.actionItems ?? [],
          chatMessages: data.chatMessages ?? [],
        });
      } catch (error) {
        console.error(error);
        setError(
          error instanceof Error ? error.message : "Failed to load meeting",
        );
      } finally {
        setLoading(false);
      }
    }

    loadMeeting();
  }, [params]);

  async function handleAnalyze() {
    if (!meetingId) return;

    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch(`/api/meetings/${meetingId}/analyze`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to analyze meeting");
      }

      // Update the state using a fresh reference
      setMeeting((prev) => ({
        ...prev,
        ...data,
        actionItems: data.actionItems ?? [],
        chatMessages: data.chatMessages ?? [],
      }));

      // Force Next.js to refresh the route cache to prevent stale data
      router.refresh();
    } catch (error) {
      console.error(error);
      setAnalysisError(
        error instanceof Error
          ? error.message
          : "Failed to analyze meeting. Please try again.",
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function confirmDelete() {
    if (!meetingId) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete meeting");
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error ? error.message : "Failed to delete meeting",
      );
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              Loading meeting...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !meeting) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <h1 className="text-lg font-semibold">Unable to load meeting</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  if (!meeting) return null;

  return (
    <>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mb-4 text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to meetings
            </button>
            <h1 className="text-3xl font-bold tracking-tight">
              {meeting.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Created {new Date(meeting.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {analyzing ? "Analyzing..." : "Analyze Meeting"}
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={deleting}
              className="rounded-md border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>

        {analysisError && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold">AI analysis failed</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {analysisError}
                </p>
              </div>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing}
                className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {analyzing ? "Retrying..." : "Try Again"}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-8">
          <MeetingSections
            summary={meeting.summary}
            keyDecisions={meeting.keyDecisions}
            openQuestions={meeting.openQuestions}
          />

          <ActionItemTable actionItems={meeting.actionItems ?? []} />

          <section className="rounded-xl border p-6">
            <h2 className="mb-4 text-xl font-semibold">Transcript</h2>
            <div className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {meeting.transcript}
            </div>
          </section>

          <MeetingChat
            meetingId={meeting.id}
            initialMessages={(meeting.chatMessages ?? [])
              .filter(
                (message) =>
                  message.role === "user" || message.role === "assistant",
              )
              .map((message) => ({
                id: message.id,
                role: message.role as "user" | "assistant",
                content: message.content,
              }))}
          />
        </div>
      </main>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Delete Meeting</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete this meeting? All transcripts,
              analysis, and action items will be permanently removed.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="rounded-md px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Meeting"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
