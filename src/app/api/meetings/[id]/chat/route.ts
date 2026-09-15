import { NextResponse } from "next/server";
import { z } from "zod";

import { openai } from "../../../../../lib/openai";
import { prisma } from "../../../../../lib/prisma";

const chatSchema = z.object({
  message: z.string().trim().min(1).max(2_000),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
) {
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
        { status: 400 },
      );
    }

    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        actionItems: true,
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
        { message: "Meeting not found" },
        { status: 404 },
      );
    }

    const context = `
Meeting title:
${meeting.title}

Meeting transcript:
${meeting.transcript}

Summary:
${meeting.summary ?? "Not analyzed yet."}

Key decisions:
${JSON.stringify(meeting.keyDecisions ?? [])}

Open questions:
${JSON.stringify(meeting.openQuestions ?? [])}

Action items:
${JSON.stringify(meeting.actionItems)}
`;

    const history = meeting.chatMessages.map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content,
    }));

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: [
        {
          role: "system",
          content: `
You are an AI assistant for a meeting management application.

Answer questions using ONLY the supplied meeting information.

Do not invent facts.

If the answer cannot be found in the meeting information, say that it is not available in this meeting.

Meeting information:

${context}
`,
        },
        ...history,
        {
          role: "user",
          content: result.data.message,
        },
      ],
    });

    const answer = response.output_text;

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
    console.error("Meeting chat error:", error);

    return NextResponse.json(
      { message: "Failed to answer question" },
      { status: 500 },
    );
  }
}