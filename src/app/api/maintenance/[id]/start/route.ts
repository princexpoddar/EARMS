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

    // Role check: Only ADMIN and MANAGER can update maintenance
    if (userSession.role !== "ADMIN" && userSession.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const { id } = await context.params;

    const ticket = await prisma.maintenance.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Maintenance ticket not found" }, { status: 404 });
    }

    if (ticket.status !== "APPROVED") {
      return NextResponse.json({ error: `Ticket must be approved before starting. Current status: ${ticket.status}` }, { status: 400 });
    }

    // Update status to IN_PROGRESS
    const updatedTicket = await prisma.maintenance.update({
      where: { id },
      data: { status: "IN_PROGRESS" },
    });

    // Log action
    await prisma.activityLog.create({
      data: {
        userId: userSession.userId,
        action: "MAINTENANCE_START",
        details: `Started maintenance work on ${ticket.asset.name} (${ticket.asset.tag})`,
      },
    });

    return NextResponse.json({ ticket: updatedTicket });
  } catch (error) {
    console.error("Start maintenance API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
