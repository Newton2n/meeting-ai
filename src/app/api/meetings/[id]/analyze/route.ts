import { NextResponse } from "next/server";
import { z } from "zod";

import { openai } from "../../../../../lib/openai";
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

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const meeting = await prisma.meeting.findUnique({
      where: { id },
    });

    if (!meeting) {
      return NextResponse.json(
        { message: "Meeting not found" },
        { status: 404 },
      );
    }

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: [
        {
          role: "system",
          content: `
You analyze meeting transcripts and extract structured information.

Return ONLY valid JSON with this structure:

{
  "summary": "string",
  "keyDecisions": ["string"],
  "openQuestions": ["string"],
  "actionItems": [
    {
      "task": "string",
      "assignee": "string or null",
      "dueDate": "string or null"
    }
  ]
}

Rules:
- Do not invent information.
- Only use information present in the transcript.
- Keep the summary concise.
- Extract concrete action items.
- If an assignee is not mentioned, use null.
- If a due date is not mentioned, use null.
`,
        },
        {
          role: "user",
          content: meeting.transcript,
        },
      ],
    });

    const text = response.output_text;

    let parsed: unknown;

    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { message: "AI returned invalid JSON" },
        { status: 502 },
      );
    }

    const result = analysisSchema.safeParse(parsed);

    if (!result.success) {
      return NextResponse.json(
        { message: "AI returned an invalid response format" },
        { status: 502 },
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
      where: { id },
      include: {
        actionItems: true,
      },
    });

    return NextResponse.json(updatedMeeting);
  } catch (error) {
    console.error("Meeting analysis error:", error);

    return NextResponse.json(
      { message: "Failed to analyze meeting" },
      { status: 500 },
    );
  }
}