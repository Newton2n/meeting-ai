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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const message = input.trim();

    if (!message || loading) {
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);

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
          data.message || "Failed to get AI response",
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
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      };

      setMessages((current) => [
        ...current,
        errorMessage,
      ]);
    } finally {
      setLoading(false);
    }
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
        {messages.length === 0 && (
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              Try asking:
            </p>

            <button
              type="button"
              onClick={() =>
                setInput(
                  "What are the important things John needs to complete?",
                )
              }
              className="mt-2 text-left text-sm font-medium text-primary hover:underline"
            >
              "What are the important things John needs to
              complete?"
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
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-5 flex flex-col gap-2 sm:flex-row"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask a question about this meeting..."
          disabled={loading}
          className="flex-1 rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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