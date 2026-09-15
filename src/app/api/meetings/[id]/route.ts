import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "../../../../lib/prisma";

const updateMeetingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .optional(),

  transcript: z
    .string()
    .trim()
    .min(10)
    .max(100_000)
    .optional(),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

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

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Get meeting error:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch meeting",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const body = await request.json();

    const result = updateMeetingSchema.safeParse(body);

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

    const existingMeeting = await prisma.meeting.findUnique({
      where: {
        id,
      },
    });

    if (!existingMeeting) {
      return NextResponse.json(
        {
          message: "Meeting not found",
        },
        {
          status: 404,
        },
      );
    }

    const meeting = await prisma.meeting.update({
      where: {
        id,
      },
      data: result.data,
    });

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Update meeting error:", error);

    return NextResponse.json(
      {
        message: "Failed to update meeting",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const existingMeeting = await prisma.meeting.findUnique({
      where: {
        id,
      },
    });

    if (!existingMeeting) {
      return NextResponse.json(
        {
          message: "Meeting not found",
        },
        {
          status: 404,
        },
      );
    }

    await prisma.meeting.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Meeting deleted successfully",
    });
  } catch (error) {
    console.error("Delete meeting error:", error);

    return NextResponse.json(
      {
        message: "Failed to delete meeting",
      },
      {
        status: 500,
      },
    );
  }
}