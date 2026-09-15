"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createMeetingSchema,
  type CreateMeetingInput,
} from "@/lib/validations";
export default function NewMeetingPage() {
  const router = useRouter();

  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateMeetingInput>({
    resolver: zodResolver(createMeetingSchema),
    defaultValues: {
      title: "",
      transcript: "",
    },
  });

  async function onSubmit(values: CreateMeetingInput) {
    setServerError("");

    try {
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create meeting");
      }

      router.push(`/meetings/${data.id}`);
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to meetings
        </Link>

        <div className="mt-8">
          <h1 className="text-3xl font-bold tracking-tight">Create Meeting</h1>

          <p className="mt-2 text-muted-foreground">
            Add a transcript and let AI turn the conversation into actionable
            work.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <label htmlFor="title" className="text-sm font-medium">
              Meeting title
            </label>

            <input
              id="title"
              {...register("title")}
              placeholder="Weekly Product Meeting"
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            {errors.title && (
              <p className="mt-2 text-sm text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="rounded-xl border bg-card p-6">
            <label htmlFor="transcript" className="text-sm font-medium">
              Meeting transcript
            </label>

            <p className="mt-1 text-xs text-muted-foreground">
              Paste your meeting notes or transcript here.
            </p>

            <textarea
              id="transcript"
              {...register("transcript")}
              rows={16}
              placeholder={`John will prepare the API documentation by Friday.

Sarah will test the payment flow next week.

The team decided to release the new version on Friday.`}
              className="mt-3 w-full resize-y rounded-lg border bg-background px-3 py-3 text-sm leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            {errors.transcript && (
              <p className="mt-2 text-sm text-destructive">
                {errors.transcript.message}
              </p>
            )}
          </div>

          {serverError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{serverError}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Meeting"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
