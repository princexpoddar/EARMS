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

    // Role check: Only ADMIN and MANAGER can approve maintenance
    if (userSession.role !== "ADMIN" && userSession.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { scheduledDate, cost } = body;

    // Fetch the ticket
    const ticket = await prisma.maintenance.findUnique({
      where: { id },
      include: { asset: true, reporter: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Maintenance ticket not found" }, { status: 404 });
    }

    if (ticket.status !== "PENDING") {
      return NextResponse.json({ error: `Ticket already processed. Status: ${ticket.status}` }, { status: 400 });
    }

    // Update Asset's status to MAINTENANCE
    await prisma.asset.update({
      where: { id: ticket.assetId },
      data: { status: "MAINTENANCE" },
    });

    // Update ticket status
    const updatedTicket = await prisma.maintenance.update({
      where: { id },
      data: {
        status: "APPROVED",
        scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
        cost: cost ? parseFloat(cost) : 0.0,
      },
    });

    // Log the approval
    await prisma.activityLog.create({
      data: {
        userId: userSession.userId,
        action: "MAINTENANCE_APPROVE",
        details: `Approved maintenance for ${ticket.asset.name} (${ticket.asset.tag})`,
      },
    });

    // Notify the reporter
    await prisma.notification.create({
      data: {
        userId: ticket.reporterId,
        title: "Maintenance Approved",
        message: `Your maintenance request for ${ticket.asset.name} was approved by ${userSession.name} and scheduled.`,
        type: "INFO",
      },
    });

    return NextResponse.json({ ticket: updatedTicket });
  } catch (error) {
    console.error("Approve maintenance API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
