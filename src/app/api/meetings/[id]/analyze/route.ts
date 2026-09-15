import { NextResponse } from "next/server";
import { z } from "zod";

import { gemini } from "../../../../../lib/gemini";
import { prisma } from "../../../../../lib/prisma";

const analysisSchema = z.object({
  summary: z.string(),
  keyDecisions: z.array(z.string()),
  openQuestions: z.array(z.string()),
  actionItems: z.array(
    z.object({
      task: z.string(),
      assignee: z.string().nullable(),
      dueDate: z.string().nullable(),
    }),
  ),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const meeting = await prisma.meeting.findUnique({
      where: {
        id,
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

    const response = await gemini.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `
Analyze the following meeting transcript.

Extract:

1. A concise meeting summary.
2. Important key decisions.
3. Open questions.
4. Concrete action items.
5. The person responsible for each action item when mentioned.
6. The due date when mentioned.

Important rules:

- Use ONLY information from the transcript.
- Do not invent names, dates, decisions, or tasks.
- If an assignee is not mentioned, use null.
- If a due date is not mentioned, use null.
- Keep the summary concise.
- Extract actual actionable tasks rather than general discussion.
- Return empty arrays when there are no decisions, questions, or action items.

Meeting title:
${meeting.title}

Meeting transcript:
${meeting.transcript}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            summary: {
              type: "string",
            },
            keyDecisions: {
              type: "array",
              items: {
                type: "string",
              },
            },
            openQuestions: {
              type: "array",
              items: {
                type: "string",
              },
            },
            actionItems: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  task: {
                    type: "string",
                  },
                  assignee: {
                    type: ["string", "null"],
                  },
                  dueDate: {
                    type: ["string", "null"],
                  },
                },
                required: ["task", "assignee", "dueDate"],
              },
            },
          },
          required: ["summary", "keyDecisions", "openQuestions", "actionItems"],
        },
      },
    });

    const text = response.text;

    if (!text) {
      return NextResponse.json(
        {
          message: "The AI service returned an empty response.",
        },
        {
          status: 502,
        },
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(text);
    } catch (error) {
      console.error("Gemini JSON parse error:", error);
      console.error("Gemini response:", text);

      return NextResponse.json(
        {
          message: "The AI service returned an invalid response.",
        },
        {
          status: 502,
        },
      );
    }

    const result = analysisSchema.safeParse(parsed);

    if (!result.success) {
      console.error("Invalid Gemini response:", result.error.flatten());

      return NextResponse.json(
        {
          message: "The AI service returned an invalid response format.",
        },
        {
          status: 502,
        },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.actionItem.deleteMany({
        where: {
          meetingId: id,
        },
      });

      await tx.meeting.update({
        where: {
          id,
        },
        data: {
          summary: result.data.summary,
          keyDecisions: result.data.keyDecisions,
          openQuestions: result.data.openQuestions,
          actionItems: {
            create: result.data.actionItems.map((item) => ({
              task: item.task,
              assignee: item.assignee,
              dueDate: item.dueDate,
            })),
          },
        },
      });
    });

    const updatedMeeting = await prisma.meeting.findUnique({
      where: {
        id,
      },
      include: {
        actionItems: true,
      },
    });

    return NextResponse.json(updatedMeeting);
  } catch (error) {
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
        message: "Failed to analyze the meeting. Please try again.",
      },
      {
        status: 500,
      },
    );
  }
}
