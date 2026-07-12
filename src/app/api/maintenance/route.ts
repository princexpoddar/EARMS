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

    let where = {};
    // Employees only see tickets they reported
    if (userSession.role !== "ADMIN" && userSession.role !== "MANAGER") {
      where = { reporterId: userSession.userId };
    }

    const tickets = await prisma.maintenance.findMany({
      where,
      include: {
        asset: {
          select: { name: true, tag: true, status: true },
        },
        reporter: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Fetch maintenance tickets API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userSession = getUserFromRequest(req);
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assetId, description, priority } = await req.json();

    if (!assetId || !description) {
      return NextResponse.json({ error: "Asset ID and Description are required" }, { status: 400 });
    }

    // Verify asset
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Create ticket
    const ticket = await prisma.maintenance.create({
      data: {
        assetId,
        reporterId: userSession.userId,
        description: description.trim(),
        priority: priority || "MEDIUM",
        status: "PENDING",
      },
      include: {
        asset: true,
      },
    });

    // Log the request
    await prisma.activityLog.create({
      data: {
        userId: userSession.userId,
        action: "MAINTENANCE_REQUEST",
        details: `Requested maintenance for ${asset.name} (${asset.tag}): "${description.substring(0, 40)}..."`,
      },
    });

    // Notify admins/managers
    const managers = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "MANAGER"] } },
    });

    await Promise.all(
      managers.map((m) =>
        prisma.notification.create({
          data: {
            userId: m.id,
            title: "New Maintenance Ticket",
            message: `${userSession.name} reported issue with ${asset.name} (${priority} priority).`,
            type: "WARNING",
          },
        })
      )
    );

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Create maintenance ticket API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
