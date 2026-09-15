import { NextResponse } from "next/server";

import { prisma } from "../../../lib/prisma";
import { createMeetingSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = createMeetingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          message: "Invalid request",
          errors: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    const meeting = await prisma.meeting.create({
      data: {
        title: result.data.title,
        transcript: result.data.transcript,
      },
    });

    return NextResponse.json(meeting, {
      status: 201,
    });
  } catch (error) {
    console.error("Create meeting error:", error);

    return NextResponse.json(
      {
        message: "Failed to create meeting",
      },
      {
        status: 500,
      },
    );
  }
}

export async function GET() {
  try {
    const meetings = await prisma.meeting.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            actionItems: true,
          },
        },
      },
    });

    return NextResponse.json(meetings);
  } catch (error) {
    console.error("Get meetings error:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch meetings",
      },
      {
        status: 500,
      },
    );
  }
}