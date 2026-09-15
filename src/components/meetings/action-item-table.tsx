"use client";

import { useState } from "react";

type ActionItem = {
  id: string;
  task: string;
  assignee: string | null;
  dueDate: string | null;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
};

type Props = {
  items: ActionItem[];
  onUpdated: (item: ActionItem) => void;
  onDeleted: (id: string) => void;
};

export function ActionItemTable({
  items,
  onUpdated,
  onDeleted,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No action items yet. Analyze the meeting to extract tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-5 py-3 text-left font-medium">
                Task
              </th>
              <th className="px-5 py-3 text-left font-medium">
                Assignee
              </th>
              <th className="px-5 py-3 text-left font-medium">
                Due
              </th>
              <th className="px-5 py-3 text-left font-medium">
                Status
              </th>
              <th className="px-5 py-3 text-right font-medium">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-4">
                  <span className="font-medium">{item.task}</span>
                </td>

                <td className="px-5 py-4 text-muted-foreground">
                  {item.assignee || "Unassigned"}
                </td>

                <td className="px-5 py-4 text-muted-foreground">
                  {item.dueDate || "No due date"}
                </td>

                <td className="px-5 py-4">
                  <StatusSelect
                    item={item}
                    onUpdated={onUpdated}
                  />
                </td>

                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(item.id)}
                      className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, onDeleted)}
                      className="rounded-md border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingId && (
        <EditActionItem
          item={items.find((item) => item.id === editingId)!}
          onClose={() => setEditingId(null)}
          onUpdated={(item) => {
            onUpdated(item);
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}

function StatusSelect({
  item,
  onUpdated,
}: {
  item: ActionItem;
  onUpdated: (item: ActionItem) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function changeStatus(
    status: ActionItem["status"],
  ) {
    if (status === item.status) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/action-items/${item.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update status");
      }

      onUpdated(data);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update status",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={item.status}
      disabled={loading}
      onChange={(event) =>
        changeStatus(
          event.target.value as ActionItem["status"],
        )
      }
      className="rounded-md border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
    >
      <option value="TODO">Todo</option>
      <option value="IN_PROGRESS">In Progress</option>
      <option value="COMPLETED">Completed</option>
    </select>
  );
}

function EditActionItem({
  item,
  onClose,
  onUpdated,
}: {
  item: ActionItem;
  onClose: () => void;
  onUpdated: (item: ActionItem) => void;
}) {
  const [task, setTask] = useState(item.task);
  const [assignee, setAssignee] = useState(item.assignee ?? "");
  const [dueDate, setDueDate] = useState(item.dueDate ?? "");
  const [status, setStatus] =
    useState<ActionItem["status"]>(item.status);

  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/action-items/${item.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            task,
            assignee: assignee || null,
            dueDate: dueDate || null,
            status,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update task");
      }

      onUpdated(data);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update task",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Edit Action Item
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="text-xl text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <Field
            label="Task"
            value={task}
            onChange={setTask}
          />

          <Field
            label="Assignee"
            value={assignee}
            onChange={setAssignee}
            placeholder="John"
          />

          <Field
            label="Due date"
            value={dueDate}
            onChange={setDueDate}
            placeholder="Friday"
          />

          <div>
            <label className="text-sm font-medium">
              Status
            </label>

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value as ActionItem["status"],
                )
              }
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 outline-none focus:border-primary"
            >
              <option value="TODO">Todo</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={save}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>

      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border bg-background px-3 py-2 outline-none focus:border-primary"
      />
    </div>
  );
}

async function handleDelete(
  id: string,
  onDeleted: (id: string) => void,
) {
  const confirmed = window.confirm(
    "Delete this action item?",
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`/api/action-items/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to delete action item",
      );
    }

    onDeleted(id);
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "Failed to delete action item",
    );
  }
}