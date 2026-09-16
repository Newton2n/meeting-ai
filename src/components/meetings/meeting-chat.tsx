"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

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
  const [error, setError] =
    useState<string | null>(null);
  const [lastQuestion, setLastQuestion] =
    useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(
    null,
  );

  const inputRef = useRef<HTMLInputElement | null>(
    null,
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function sendMessage(message: string) {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || loading) {
      return;
    }

    setError(null);
    setLastQuestion(trimmedMessage);
    setLoading(true);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedMessage,
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

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
            message: trimmedMessage,
          }),
        },
      );

      let data: {
        answer?: string;
        message?: string;
      };

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response.",
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to get AI response.",
        );
      }

      if (
        !data.answer ||
        typeof data.answer !== "string"
      ) {
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
    } catch (sendError) {
      console.error("Meeting chat error:", sendError);

      setError(
        sendError instanceof Error
          ? sendError.message
          : "Something went wrong. Please try again.",
      );

      setMessages((current) =>
        current.filter(
          (item) => item.id !== userMessage.id,
        ),
      );
    } finally {
      setLoading(false);

      window.setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    await sendMessage(input);
  }

  async function handleRetry() {
    if (!lastQuestion || loading) {
      return;
    }

    await sendMessage(lastQuestion);
  }

  function handleSuggestion(question: string) {
    setInput(question);
    setError(null);

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="shrink-0 border-b px-4 py-3 sm:px-5 sm:py-4">
        <h2 className="text-sm font-semibold sm:text-base">
          AI Meeting Assistant
        </h2>

        <p className="mt-1 text-[11px] leading-4 text-muted-foreground sm:text-xs">
          Ask questions about this meeting.
        </p>
      </div>

      {/* Messages */}
      <div
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-4 sm:px-5 sm:py-5"
        aria-live="polite"
        aria-busy={loading}
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:gap-4">
          {messages.length === 0 && !error && (
            <div className="rounded-xl border bg-muted/40 p-3 sm:p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Try asking
              </p>

              <button
                type="button"
                onClick={() =>
                  handleSuggestion(
                    "What are the important things John needs to complete?",
                  )
                }
                className="mt-2 block min-h-10 w-full rounded-md text-left text-sm font-medium leading-5 text-primary transition-colors hover:bg-primary/5 hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                What are the important things John needs
                to complete?
              </button>
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.role === "user";

            return (
              <div
                key={message.id}
                className={`flex w-full ${
                  isUser
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={[
                    "min-w-0 max-w-[92%] break-words rounded-2xl px-3 py-2.5 text-sm shadow-sm sm:max-w-[85%] sm:px-4 sm:py-3",
                    isUser
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-muted text-foreground",
                  ].join(" ")}
                >
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70 sm:text-[11px]">
                    {isUser ? "You" : "AI"}
                  </p>

                  <p className="whitespace-pre-wrap break-words leading-6 [overflow-wrap:anywhere]">
                    {message.content}
                  </p>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex w-full justify-start">
              <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-muted px-3 py-2.5 sm:max-w-[85%] sm:px-4 sm:py-3">
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center gap-1"
                    aria-label="AI is thinking"
                  >
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-50 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-50 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-50" />
                  </div>

                  <span className="text-xs text-muted-foreground">
                    AI is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 sm:p-4"
            >
              <p className="text-sm font-medium">
                Unable to get an AI response
              </p>

              <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
                {error}
              </p>

              {lastQuestion && (
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={loading}
                  className="mt-3 min-h-9 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Retrying..." : "Try Again"}
                </button>
              )}
            </div>
          )}

          <div
            ref={messagesEndRef}
            className="h-px w-full shrink-0"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t bg-background p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 sm:flex-row">
          <label htmlFor="meeting-chat-input" className="sr-only">
            Ask a question about this meeting
          </label>

          <input
            ref={inputRef}
            id="meeting-chat-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);

              if (error) {
                setError(null);
              }
            }}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();

                if (input.trim() && !loading) {
                  void sendMessage(input);
                }
              }
            }}
            placeholder="Ask about this meeting..."
            autoComplete="off"
            disabled={loading}
            maxLength={2000}
            className="min-h-11 min-w-0 w-full flex-1 rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-10"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="min-h-11 w-full shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-10 sm:w-auto"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                  aria-hidden="true"
                />
                <span className="sm:hidden">
                  Sending...
                </span>
                <span className="hidden sm:inline">
                  Sending
                </span>
              </span>
            ) : (
              "Ask"
            )}
          </button>
        </div>

        <p className="mx-auto mt-2 hidden w-full max-w-3xl text-[10px] text-muted-foreground sm:block">
          Press Enter to send.
        </p>
      </form>
    </div>
  );
}