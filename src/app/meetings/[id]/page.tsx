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

type MeetingPageProps = {
  params: Promise<{ id: string }>;
};

export default function MeetingPage({
  params,
}: MeetingPageProps) {
  const router = useRouter();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadMeeting() {
      try {
        const { id } = await params;

        if (!isMounted) {
          return;
        }

        setMeetingId(id);

        const response = await fetch(`/api/meetings/${id}`, {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch meeting",
          );
        }

        if (!isMounted) {
          return;
        }

        setMeeting({
          ...data,
          actionItems: data.actionItems ?? [],
          chatMessages: data.chatMessages ?? [],
        });
      } catch (loadError) {
        console.error(loadError);

        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load meeting",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadMeeting();

    return () => {
      isMounted = false;
    };
  }, [params]);

  useEffect(() => {
    if (!showChat && !showDeleteModal) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [showChat, showDeleteModal]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      if (showChat) {
        setShowChat(false);
      }

      if (showDeleteModal && !deleting) {
        setShowDeleteModal(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showChat, showDeleteModal, deleting]);

  async function handleAnalyze() {
    if (!meetingId || analyzing) {
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch(
        `/api/meetings/${meetingId}/analyze`,
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

      setMeeting((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          ...data,
          actionItems: data.actionItems ?? [],
          chatMessages: data.chatMessages ?? [],
        };
      });

      router.refresh();
    } catch (analysisErrorValue) {
      console.error(analysisErrorValue);

      setAnalysisError(
        analysisErrorValue instanceof Error
          ? analysisErrorValue.message
          : "Failed to analyze meeting. Please try again.",
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function confirmDelete() {
    if (!meetingId || deleting) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(
        `/api/meetings/${meetingId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete meeting",
        );
      }

      router.push("/");
      router.refresh();
    } catch (deleteError) {
      console.error(deleteError);

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete meeting",
      );

      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  function closeDeleteModal() {
    if (!deleting) {
      setShowDeleteModal(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <div
              className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary"
              aria-label="Loading"
            />

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
      <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:p-6">
          <h1 className="text-lg font-semibold">
            Unable to load meeting
          </h1>

          <p className="mt-2 break-words text-sm text-muted-foreground">
            {error}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 min-h-10 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  if (!meeting) {
    return null;
  }

  const chatMessages = (meeting.chatMessages ?? [])
    .filter(
      (message) =>
        message.role === "user" ||
        message.role === "assistant",
    )
    .map((message) => ({
      id: message.id,
      role: message.role as "user" | "assistant",
      content: message.content,
    }));

  return (
    <>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="mb-4 inline-flex min-h-10 items-center rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <span aria-hidden="true" className="mr-1">
                  ←
                </span>
                Back to meetings
              </button>

              <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                {meeting.title}
              </h1>

              <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
                Created{" "}
                {new Date(meeting.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap lg:justify-end">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing}
                className="min-h-10 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {analyzing ? "Analyzing..." : "Analyze Meeting"}
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                disabled={deleting}
                className="min-h-10 w-full rounded-md border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                Delete
              </button>
            </div>
          </div>
        </header>

        {/* General Error */}
        {error && meeting && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="break-words text-sm text-muted-foreground">
                {error}
              </p>

              <button
                type="button"
                onClick={() => setError(null)}
                className="min-h-10 shrink-0 rounded-md px-3 py-2 text-sm font-medium hover:bg-destructive/10"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Analysis Error */}
        {analysisError && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:p-5"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="font-semibold">
                  AI analysis failed
                </h2>

                <p className="mt-1 break-words text-sm text-muted-foreground">
                  {analysisError}
                </p>
              </div>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing}
                className="min-h-10 w-full shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {analyzing ? "Retrying..." : "Try Again"}
              </button>
            </div>
          </div>
        )}

        {/* Meeting Content */}
        <div className="min-w-0 space-y-6 sm:space-y-8">
          <MeetingSections
            summary={meeting.summary}
            keyDecisions={meeting.keyDecisions}
            openQuestions={meeting.openQuestions}
          />

          <section className="min-w-0 overflow-hidden">
            <ActionItemTable
              actionItems={meeting.actionItems ?? []}
            />
          </section>

          {/* Transcript */}
          <section className="min-w-0 overflow-hidden rounded-xl border bg-card p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold sm:text-xl">
              Transcript
            </h2>

            <div className="max-h-[min(70vh,700px)] overflow-y-auto whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground [overflow-wrap:anywhere]">
              {meeting.transcript || "No transcript available."}
            </div>
          </section>
        </div>
      </main>

      {/* Floating AI Button */}
      <button
        type="button"
        onClick={() => setShowChat(true)}
        aria-label="Open AI meeting assistant"
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14 sm:text-xl"
      >
        <span aria-hidden="true">✦</span>
      </button>

      {/* AI Chat Modal */}
      {showChat && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-chat-title"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close AI chat"
            onClick={() => setShowChat(false)}
            className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-[2px]"
          />

          {/* Chat Window */}
          <div className="absolute inset-x-2 bottom-2 top-2 flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl sm:inset-x-auto sm:bottom-4 sm:right-4 sm:top-auto sm:h-[min(680px,calc(100vh-2rem))] sm:w-[min(420px,calc(100vw-2rem))]">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3 sm:px-5 sm:py-4">
              <div className="min-w-0">
                <h2
                  id="ai-chat-title"
                  className="truncate font-semibold"
                >
                  AI Meeting Assistant
                </h2>

                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  Ask questions about this meeting
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowChat(false)}
                aria-label="Close AI chat"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              <MeetingChat
                meetingId={meeting.id}
                initialMessages={chatMessages}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-meeting-title"
        >
          <div className="w-full max-w-md rounded-2xl border bg-background p-5 shadow-xl sm:rounded-xl sm:p-6">
            <h3
              id="delete-meeting-title"
              className="text-lg font-semibold"
            >
              Delete Meeting
            </h3>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Are you sure you want to delete this meeting?
              All transcripts, analysis, and action items will
              be permanently removed.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-2 sm:flex sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="min-h-10 w-full rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="min-h-10 w-full rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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