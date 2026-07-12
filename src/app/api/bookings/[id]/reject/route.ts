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

    const { id } = await context.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Authorization: User can cancel their own booking, or Manager/Admin can reject/cancel any booking
    if (
      userSession.role !== "ADMIN" &&
      userSession.role !== "MANAGER" &&
      booking.userId !== userSession.userId
    ) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    if (booking.status === "REJECTED" || booking.status === "COMPLETED") {
      return NextResponse.json({ error: `Booking has already been processed. Status: ${booking.status}` }, { status: 400 });
    }

    const newStatus = "REJECTED"; // Set status to REJECTED or CANCELLED

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: newStatus },
    });

    // Log the rejection/cancellation
    const logAction = booking.userId === userSession.userId ? "RESOURCE_CANCEL" : "RESOURCE_REJECT";
    await prisma.activityLog.create({
      data: {
        userId: userSession.userId,
        action: logAction,
        details: `${logAction === "RESOURCE_CANCEL" ? "Cancelled" : "Rejected"} booking for ${booking.asset.name} (${booking.asset.tag})`,
      },
    });

    // Notify user if rejected by someone else
    if (booking.userId !== userSession.userId) {
      await prisma.notification.create({
        data: {
          userId: booking.userId,
          title: "Booking Request Declined",
          message: `Your booking for ${booking.asset.name} was declined by ${userSession.name}.`,
          type: "WARNING",
        },
      });
    }

    return NextResponse.json({ booking: updatedBooking });
  } catch (error) {
    console.error("Reject booking API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
