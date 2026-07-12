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

    // Role check: Only ADMIN and MANAGER can resolve maintenance
    if (userSession.role !== "ADMIN" && userSession.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { cost, comments } = body;

    // Fetch the ticket
    const ticket = await prisma.maintenance.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Maintenance ticket not found" }, { status: 404 });
    }

    if (ticket.status === "RESOLVED") {
      return NextResponse.json({ error: "Ticket is already resolved" }, { status: 400 });
    }

    // Determine final status of the asset
    // If it has an assigned custodian, mark it back as ALLOCATED.
    // If it has no custodian, mark it as AVAILABLE.
    const nextAssetStatus = ticket.asset.currentUserId ? "ALLOCATED" : "AVAILABLE";

    // Update Asset status
    await prisma.asset.update({
      where: { id: ticket.assetId },
      data: { status: nextAssetStatus },
    });

    // Update ticket status to RESOLVED
    const updatedTicket = await prisma.maintenance.update({
      where: { id },
      data: {
        status: "RESOLVED",
        completedDate: new Date(),
        cost: cost ? parseFloat(cost) : ticket.cost,
        comments: comments?.trim() || null,
      },
    });

    // Log the resolution
    await prisma.activityLog.create({
      data: {
        userId: userSession.userId,
        action: "MAINTENANCE_RESOLVE",
        details: `Resolved maintenance on ${ticket.asset.name} (${ticket.asset.tag}). Cost: $${cost || 0.0}`,
      },
    });

    // Notify the reporter
    await prisma.notification.create({
      data: {
        userId: ticket.reporterId,
        title: "Maintenance Work Resolved",
        message: `Maintenance issue for ${ticket.asset.name} has been resolved. Comments: ${comments || "No comments."}`,
        type: "SUCCESS",
      },
    });

    return NextResponse.json({ ticket: updatedTicket });
  } catch (error) {
    console.error("Resolve maintenance API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
