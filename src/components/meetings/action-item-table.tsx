"use client";

// ADDED: Import useEffect
import { useState, useEffect } from "react";

type ActionItem = {
  id: string;
  task: string;
  assignee: string | null;
  dueDate: string | null;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
};

type Props = {
  actionItems: ActionItem[];
};

const statusLabels = {
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export function ActionItemTable({ actionItems }: Props) {
  const [items, setItems] = useState<ActionItem[]>(actionItems);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // ✅ ADDED: This listens for new AI data from the parent and updates the table!
  useEffect(() => {
    setItems(actionItems);
  }, [actionItems]);

  async function updateStatus(id: string, status: ActionItem["status"]) {
    setLoadingId(id);

    try {
      const response = await fetch(`/api/action-items/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update status");
      }

      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, status } : item,
        ),
      );
    } catch (error) {
      console.error("Update status error:", error);
      alert(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setLoadingId(null);
    }
  }

  async function deleteItem(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this action item?",
    );

    if (!confirmed) {
      return;
    }

    setLoadingId(id);

    try {
      const response = await fetch(`/api/action-items/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete action item");
      }

      setItems((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Delete action item error:", error);
      alert(error instanceof Error ? error.message : "Failed to delete action item");
    } finally {
      setLoadingId(null);
    }
  }

  async function saveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingItem) {
      return;
    }

    setLoadingId(editingItem.id);

    try {
      const response = await fetch(`/api/action-items/${editingItem.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: editingItem.task,
          assignee: editingItem.assignee,
          dueDate: editingItem.dueDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update action item");
      }

      setItems((current) =>
        current.map((item) => (item.id === editingItem.id ? data : item)),
      );

      setEditingItem(null);
    } catch (error) {
      console.error("Edit action item error:", error);
      alert(error instanceof Error ? error.message : "Failed to update action item");
    } finally {
      setLoadingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <section className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Action Items</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No action items have been extracted yet.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="rounded-xl border bg-card p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Action Items</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage tasks extracted from this meeting.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-3 py-3 font-medium">Task</th>
                <th className="px-3 py-3 font-medium">Assignee</th>
                <th className="px-3 py-3 font-medium">Due Date</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="px-3 py-4">
                    <p className="font-medium">{item.task}</p>
                  </td>

                  <td className="px-3 py-4 text-muted-foreground">
                    {item.assignee || "Not assigned"}
                  </td>

                  <td className="px-3 py-4 text-muted-foreground">
                    {item.dueDate || "No due date"}
                  </td>

                  <td className="px-3 py-4">
                    <select
                      value={item.status}
                      disabled={loadingId === item.id}
                      onChange={(event) =>
                        updateStatus(item.id, event.target.value as ActionItem["status"])
                      }
                      className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-3 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingItem(item)}
                        disabled={loadingId === item.id}
                        className="rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteItem(item.id)}
                        disabled={loadingId === item.id}
                        className="rounded-md border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/5 disabled:opacity-50"
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
      </section>

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-xl">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">Edit Action Item</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Update the task information.
              </p>
            </div>

            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Task</label>
                <textarea
                  value={editingItem.task}
                  onChange={(event) =>
                    setEditingItem({
                      ...editingItem,
                      task: event.target.value,
                    })
                  }
                  rows={3}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Assignee</label>
                <input
                  value={editingItem.assignee ?? ""}
                  onChange={(event) =>
                    setEditingItem({
                      ...editingItem,
                      assignee: event.target.value || null,
                    })
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Due Date</label>
                <input
                  value={editingItem.dueDate ?? ""}
                  onChange={(event) =>
                    setEditingItem({
                      ...editingItem,
                      dueDate: event.target.value || null,
                    })
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loadingId === editingItem.id}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {loadingId === editingItem.id ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}