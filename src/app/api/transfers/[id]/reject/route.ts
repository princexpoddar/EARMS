import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userSession = getUserFromRequest(req);
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only ADMIN and MANAGER can reject transfers
    if (userSession.role !== "ADMIN" && userSession.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const { id } = await context.params;

    // Fetch transfer
    const transfer = await prisma.transferRequest.findUnique({
      where: { id },
      include: {
        asset: true,
        sender: true,
        receiver: true,
      },
    });

    if (!transfer) {
      return NextResponse.json({ error: "Transfer request not found" }, { status: 404 });
    }

    if (transfer.status !== "PENDING") {
      return NextResponse.json({ error: `Request has already been processed. Status: ${transfer.status}` }, { status: 400 });
    }

    // Update Transfer Request status to REJECTED
    const updatedTransfer = await prisma.transferRequest.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    // Log the rejection
    await prisma.activityLog.create({
      data: {
        userId: userSession.userId,
        action: "TRANSFER_REJECT",
        details: `Rejected transfer of ${transfer.asset.name} to ${transfer.receiver.name}`,
      },
    });

    // Notify the sender
    await prisma.notification.create({
      data: {
        userId: transfer.senderId,
        title: "Transfer Request Rejected",
        message: `Your request to transfer ${transfer.asset.name} to ${transfer.receiver.name} was declined by ${userSession.name}.`,
        type: "WARNING",
      },
    });

    return NextResponse.json({ transfer: updatedTransfer });
  } catch (error) {
    console.error("Reject transfer API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
