import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const userSession = getUserFromRequest(req);
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      include: {
        asset: {
          select: { name: true, tag: true, location: true },
        },
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Fetch bookings API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userSession = getUserFromRequest(req);
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assetId, startDate, endDate, purpose } = await req.json();

    if (!assetId || !startDate || !endDate || !purpose) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const requestedStart = new Date(startDate);
    const requestedEnd = new Date(endDate);

    // Business rule: End date must be after start date
    if (requestedEnd <= requestedStart) {
      return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
    }

    // Business rule: Start date cannot be in the past
    if (requestedStart < new Date(new Date().setMinutes(new Date().getMinutes() - 5))) {
      return NextResponse.json({ error: "Booking cannot be scheduled in the past" }, { status: 400 });
    }

    // Conflict detection: check overlapping bookings for this asset
    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        assetId,
        status: { in: ["PENDING", "APPROVED"] },
        AND: [
          { startDate: { lt: requestedEnd } },
          { endDate: { gt: requestedStart } },
        ],
      },
    });

    if (overlappingBooking) {
      return NextResponse.json(
        {
          error: "Booking conflict: The resource is already reserved or pending during this time slot.",
        },
        { status: 400 }
      );
    }

    // Determine default status
    // Admins and Managers get auto-approved. Employees get PENDING.
    const defaultStatus =
      userSession.role === "ADMIN" || userSession.role === "MANAGER"
        ? "APPROVED"
        : "PENDING";

    const booking = await prisma.booking.create({
      data: {
        assetId,
        userId: userSession.userId,
        startDate: requestedStart,
        endDate: requestedEnd,
        purpose: purpose.trim(),
        status: defaultStatus,
      },
      include: {
        asset: true,
      },
    });

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId: userSession.userId,
        action: "RESOURCE_BOOK",
        details: `Booked ${booking.asset.name} (${booking.asset.tag}) for "${booking.purpose}" (${defaultStatus})`,
      },
    });

    // Create notifications
    if (defaultStatus === "PENDING") {
      // Notify managers
      const managers = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "MANAGER"] } },
      });
      await Promise.all(
        managers.map((m) =>
          prisma.notification.create({
            data: {
              userId: m.id,
              title: "New Booking Pending",
              message: `${userSession.name} requested to book ${booking.asset.name}.`,
              type: "INFO",
            },
          })
        )
      );
    } else {
      // Notify requester (success)
      await prisma.notification.create({
        data: {
          userId: userSession.userId,
          title: "Booking Confirmed",
          message: `Your booking for ${booking.asset.name} was auto-approved and confirmed.`,
          type: "SUCCESS",
        },
      });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Create booking API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
