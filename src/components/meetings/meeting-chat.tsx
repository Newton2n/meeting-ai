"use client";

import { FormEvent, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Props = {
  meetingId: string;
  initialMessages?: Message[];
};

export function MeetingChat({
  meetingId,
  initialMessages = [],
}: Props) {
  const [messages, setMessages] =
    useState<Message[]>(initialMessages);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuestion, setLastQuestion] = useState<string | null>(
    null,
  );

  async function sendMessage(message: string) {
    if (!message || loading) {
      return;
    }

    setError(null);
    setLastQuestion(message);
    setLoading(true);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");

    try {
      const response = await fetch(
        `/api/meetings/${meetingId}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to get AI response.",
        );
      }

      if (!data.answer) {
        throw new Error(
          "The AI service returned an empty response.",
        );
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer,
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);

      setLastQuestion(null);
    } catch (error) {
      console.error("Meeting chat error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );

      setMessages((current) =>
        current.filter(
          (item) => item.id !== userMessage.id,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const message = input.trim();

    if (!message || loading) {
      return;
    }

    await sendMessage(message);
  }

  async function handleRetry() {
    if (!lastQuestion || loading) {
      return;
    }

    await sendMessage(lastQuestion);
  }

  function handleSuggestion(question: string) {
    setInput(question);
  }

  return (
    <section className="rounded-xl border bg-card p-6">
      <div>
        <h2 className="text-lg font-semibold">
          Ask about this meeting
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Ask questions about the transcript, decisions, or
          action items.
        </p>
      </div>

      <div className="mt-5 min-h-[180px] space-y-4">
        {messages.length === 0 && !error && (
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              Try asking:
            </p>

            <button
              type="button"
              onClick={() =>
                handleSuggestion(
                  "What are the important things John needs to complete?",
                )
              }
              className="mt-2 text-left text-sm font-medium text-primary hover:underline"
            >
              What are the important things John needs to
              complete?
            </button>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user"
                ? "ml-auto max-w-[85%] rounded-xl bg-primary p-4 text-sm text-primary-foreground"
                : "max-w-[85%] rounded-xl bg-muted p-4 text-sm"
            }
          >
            <p className="mb-1 text-xs font-medium opacity-70">
              {message.role === "user" ? "You" : "AI"}
            </p>

            <p className="whitespace-pre-wrap leading-6">
              {message.content}
            </p>
          </div>
        ))}

        {loading && (
          <div className="max-w-[85%] rounded-xl bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              AI is thinking...
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">
                  Unable to get an AI response
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {error}
                </p>
              </div>

              {lastQuestion && (
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={loading}
                  className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-5 flex flex-col gap-2 sm:flex-row"
      >
        <input
          value={input}
          onChange={(event) => {
            setInput(event.target.value);

            if (error) {
              setError(null);
            }
          }}
          placeholder="Ask a question about this meeting..."
          disabled={loading}
          maxLength={2000}
          className="flex-1 rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Asking..." : "Ask"}
        </button>
      </form>
    </section>
  );
}