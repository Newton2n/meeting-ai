"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

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
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Create Meeting</h1>

      <p className="mt-2 text-muted-foreground">
        Add your meeting transcript and let AI turn it into actionable tasks.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-medium">
            Meeting title
          </label>

          <input
            id="title"
            {...register("title")}
            placeholder="Weekly Product Meeting"
            className="w-full rounded-md border px-3 py-2"
            aria-invalid={!!errors.title}
          />

          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        {/* Transcript */}
        <div>
          <label
            htmlFor="transcript"
            className="mb-2 block text-sm font-medium"
          >
            Meeting transcript
          </label>

          <textarea
            id="transcript"
            {...register("transcript")}
            placeholder="John will prepare the API documentation by Friday..."
            rows={14}
            className="w-full resize-y rounded-md border px-3 py-2"
            aria-invalid={!!errors.transcript}
          />

          {errors.transcript && (
            <p className="mt-1 text-sm text-red-500">
              {errors.transcript.message}
            </p>
          )}
        </div>

        {/* Server error */}
        {serverError && <p className="text-sm text-red-500">{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create Meeting"}
        </button>
      </form>
    </main>
  );
}
