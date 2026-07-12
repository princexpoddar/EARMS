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

    // Role check: Only ADMIN and MANAGER can approve transfers
    if (userSession.role !== "ADMIN" && userSession.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const { id } = await context.params;

    // Fetch the transfer request
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

    // Business rule: Cannot approve transfer for retired assets
    if (transfer.asset.status === "RETIRED") {
      return NextResponse.json({ error: "Cannot approve transfer: The asset has been retired." }, { status: 400 });
    }

    // Determine target status of the asset
    // If the asset is currently in MAINTENANCE, preserve its status instead of changing to ALLOCATED.
    const targetStatus = transfer.asset.status === "MAINTENANCE" ? "MAINTENANCE" : "ALLOCATED";

    // Update the Asset custodian and department
    await prisma.asset.update({
      where: { id: transfer.assetId },
      data: {
        currentUserId: transfer.receiverId,
        departmentId: transfer.receiver.departmentId,
        status: targetStatus,
      },
    });

    // Update the Transfer Request status
    const updatedTransfer = await prisma.transferRequest.update({
      where: { id },
      data: { status: "APPROVED" },
    });

    // Log the approval
    await prisma.activityLog.create({
      data: {
        userId: userSession.userId,
        action: "TRANSFER_APPROVE",
        details: `Approved transfer of ${transfer.asset.name} (${transfer.asset.tag}) to ${transfer.receiver.name}`,
      },
    });

    // Notify the receiver
    await prisma.notification.create({
      data: {
        userId: transfer.receiverId,
        title: "Asset Transfer Received",
        message: `Asset ${transfer.asset.name} (${transfer.asset.tag}) has been transferred to you from ${transfer.sender.name}.`,
        type: "SUCCESS",
      },
    });

    // Notify the sender
    await prisma.notification.create({
      data: {
        userId: transfer.senderId,
        title: "Asset Transfer Complete",
        message: `Your transfer of ${transfer.asset.name} to ${transfer.receiver.name} was approved by ${userSession.name}.`,
        type: "INFO",
      },
    });

    return NextResponse.json({ transfer: updatedTransfer });
  } catch (error) {
    console.error("Approve transfer API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
