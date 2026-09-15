import { NextResponse } from "next/server";

import { prisma } from "../../../../lib/prisma";
import { updateActionItemSchema } from "@/lib/validation/action-item";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const body = await request.json();

    const result =
      updateActionItemSchema.safeParse(body);

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

    const existingItem =
      await prisma.actionItem.findUnique({
        where: {
          id,
        },
      });

    if (!existingItem) {
      return NextResponse.json(
        {
          message: "Action item not found",
        },
        {
          status: 404,
        },
      );
    }

    const actionItem =
      await prisma.actionItem.update({
        where: {
          id,
        },

        data: result.data,
      });

    return NextResponse.json(actionItem);
  } catch (error) {
    console.error(
      "Update action item error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Failed to update action item",
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

    const existingItem =
      await prisma.actionItem.findUnique({
        where: {
          id,
        },
      });

    if (!existingItem) {
      return NextResponse.json(
        {
          message: "Action item not found",
        },
        {
          status: 404,
        },
      );
    }

    await prisma.actionItem.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message:
        "Action item deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete action item error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Failed to delete action item",
      },
      {
        status: 500,
      },
    );
  }
}