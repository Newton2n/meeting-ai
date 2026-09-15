import { NextResponse } from "next/server";
import { z } from "zod";

import { gemini } from "../../../../../lib/gemini";
import { withGeminiRetry } from "../../../../../lib/gemini-retry";
import { prisma } from "../../../../../lib/prisma";

const chatSchema = z.object({
  message: z.string().trim().min(1).max(2_000),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const body = await request.json();

    const result = chatSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          message: "Invalid request",
          errors: result.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }

    const meeting = await prisma.meeting.findUnique({
      where: {
        id,
      },

      include: {
        actionItems: {
          orderBy: {
            createdAt: "asc",
          },
        },

        chatMessages: {
          orderBy: {
            createdAt: "asc",
          },

          take: 20,
        },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        {
          message: "Meeting not found",
        },
        {
          status: 404,
        },
      );
    }

    const actionItems = meeting.actionItems.map((item) => ({
      task: item.task,
      assignee: item.assignee,
      dueDate: item.dueDate,
      status: item.status,
    }));

    const previousMessages = meeting.chatMessages
      .map((message) => `${message.role}: ${message.content}`)
      .join("\n");

    const meetingContext = `
Meeting title:
${meeting.title}

Transcript:
${meeting.transcript}

Summary:
${meeting.summary ?? "Not available"}

Key decisions:
${JSON.stringify(meeting.keyDecisions ?? [])}

Open questions:
${JSON.stringify(meeting.openQuestions ?? [])}

Action items:
${JSON.stringify(actionItems)}

Previous conversation:
${previousMessages || "No previous conversation"}
`;

    const response = await withGeminiRetry(() =>
      gemini.models.generateContent({
        model: "gemini-3.6-flash",

        contents: `
You are an AI meeting assistant.

Answer the user's question using ONLY the meeting information provided below.

Rules:

- Do not invent information.
- Do not use outside knowledge.
- If the answer cannot be found in the meeting information, say that the information is not available in this meeting.
- Give a concise and useful answer.
- When discussing tasks, mention the assignee and due date when available.
- Use the previous conversation only as context.

MEETING INFORMATION
===================

${meetingContext}

USER QUESTION
=============

${result.data.message}
        `,
      }),
    );

    const answer = response.text;

    if (!answer) {
      throw new Error("Gemini returned an empty response");
    }

    await prisma.chatMessage.createMany({
      data: [
        {
          meetingId: id,
          role: "user",
          content: result.data.message,
        },

        {
          meetingId: id,
          role: "assistant",
          content: answer,
        },
      ],
    });

    return NextResponse.json({
      answer,
    });
  } catch (error) {
    console.error("========== GEMINI CHAT ERROR ==========");

    console.error(error);

    console.error("=======================================");

    const errorMessage = error instanceof Error ? error.message : "";

    if (
      errorMessage.includes("503") ||
      errorMessage.includes("UNAVAILABLE") ||
      errorMessage.includes("high demand")
    ) {
      return NextResponse.json(
        {
          message:
            "The AI service is temporarily busy. Please try again in a moment.",
        },
        {
          status: 503,
        },
      );
    }

    if (
      errorMessage.includes("429") ||
      errorMessage.includes("RESOURCE_EXHAUSTED")
    ) {
      return NextResponse.json(
        {
          message:
            "The AI service is temporarily unavailable due to usage limits. Please try again later.",
        },
        {
          status: 429,
        },
      );
    }

    if (
      errorMessage.includes("401") ||
      errorMessage.includes("403") ||
      errorMessage.includes("API key")
    ) {
      return NextResponse.json(
        {
          message:
            "The AI service could not be authenticated. Please check the API configuration.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      {
        message: "Failed to answer the question. Please try again.",
      },
      {
        status: 500,
      },
    );
  }
}
