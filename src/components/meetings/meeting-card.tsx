import Link from "next/link";

type MeetingCardProps = {
  meeting: {
    id: string;
    title: string;
    createdAt: string;
    _count: {
      actionItems: number;
    };
  };
};

export function MeetingCard({ meeting }: MeetingCardProps) {
  const date = new Date(meeting.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="group block rounded-xl border bg-card p-6 transition-shadow hover:shadow-md"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold group-hover:text-primary">
            {meeting.title}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {date}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
            {meeting._count.actionItems}{" "}
            {meeting._count.actionItems === 1
              ? "action item"
              : "action items"}
          </span>

          <span className="text-sm text-muted-foreground">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}