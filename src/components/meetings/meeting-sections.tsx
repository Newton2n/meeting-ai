type MeetingSectionsProps = {
  summary: string | null;
  keyDecisions: unknown;
  openQuestions: unknown;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string => typeof item === "string",
  );
}

export function MeetingSections({
  summary,
  keyDecisions,
  openQuestions,
}: MeetingSectionsProps) {
  const decisions = toStringArray(keyDecisions);
  const questions = toStringArray(openQuestions);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Summary</h2>

        {summary ? (
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {summary}
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            This meeting has not been analyzed yet.
          </p>
        )}
      </section>

      <section className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Key Decisions</h2>

        {decisions.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {decisions.map((decision, index) => (
              <li
                key={`${decision}-${index}`}
                className="flex gap-3 text-sm"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                  ✓
                </span>

                <span className="leading-6">{decision}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No key decisions extracted.
          </p>
        )}
      </section>

      <section className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Open Questions</h2>

        {questions.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {questions.map((question, index) => (
              <li
                key={`${question}-${index}`}
                className="flex gap-3 text-sm"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
                  ?
                </span>

                <span className="leading-6">{question}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No open questions extracted.
          </p>
        )}
      </section>
    </div>
  );
}