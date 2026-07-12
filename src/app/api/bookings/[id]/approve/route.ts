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

    // Role check: Only ADMIN and MANAGER can approve bookings
    if (userSession.role !== "ADMIN" && userSession.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const { id } = await context.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json({ error: `Booking has already been processed. Status: ${booking.status}` }, { status: 400 });
    }

    // Check conflict one more time before approval
    const conflict = await prisma.booking.findFirst({
      where: {
        assetId: booking.assetId,
        status: "APPROVED",
        id: { not: booking.id },
        AND: [
          { startDate: { lt: booking.endDate } },
          { endDate: { gt: booking.startDate } },
        ],
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "Conflict detected: Another booking was approved in this slot while pending." },
        { status: 400 }
      );
    }

    // Update status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: "APPROVED" },
    });

    // Log the approval
    await prisma.activityLog.create({
      data: {
        userId: userSession.userId,
        action: "RESOURCE_APPROVE",
        details: `Approved booking for ${booking.asset.name} (${booking.asset.tag})`,
      },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        title: "Booking Request Approved",
        message: `Your booking for ${booking.asset.name} has been approved by ${userSession.name}.`,
        type: "SUCCESS",
      },
    });

    return NextResponse.json({ booking: updatedBooking });
  } catch (error) {
    console.error("Approve booking API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
