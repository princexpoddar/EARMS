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
    // If not Admin/Manager, restrict to requests sent or received by the user
    if (userSession.role !== "ADMIN" && userSession.role !== "MANAGER") {
      where = {
        OR: [
          { senderId: userSession.userId },
          { receiverId: userSession.userId },
        ],
      };
    }

    const transfers = await prisma.transferRequest.findMany({
      where,
      include: {
        asset: {
          select: { name: true, tag: true, currentUserId: true },
        },
        sender: {
          select: { name: true, email: true },
        },
        receiver: {
          select: { name: true, email: true, departmentId: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ transfers });
  } catch (error) {
    console.error("Fetch transfers API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userSession = getUserFromRequest(req);
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assetId, receiverId, notes } = await req.json();

    if (!assetId || !receiverId) {
      return NextResponse.json({ error: "Asset ID and Receiver ID are required" }, { status: 400 });
    }

    // Fetch receiver details
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      include: { department: true }
    });

    if (!receiver) {
      return NextResponse.json({ error: "Receiver user not found" }, { status: 404 });
    }

    // Fetch asset details
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Business rule: Cannot transfer retired asset
    if (asset.status === "RETIRED") {
      return NextResponse.json({ error: "Cannot transfer retired asset" }, { status: 400 });
    }

    // Business rule: Employee can only transfer assets currently allocated to them
    if (
      userSession.role !== "ADMIN" &&
      userSession.role !== "MANAGER" &&
      asset.currentUserId !== userSession.userId
    ) {
      return NextResponse.json({ error: "You can only request transfers for assets currently allocated to you" }, { status: 403 });
    }

    // Create Transfer Request
    const transfer = await prisma.transferRequest.create({
      data: {
        assetId,
        senderId: asset.currentUserId || userSession.userId, // If unallocated, sender is requester
        receiverId,
        targetDepartmentId: receiver.departmentId,
        notes: notes?.trim() || null,
        status: "PENDING",
      },
      include: {
        asset: true,
      },
    });

    // Log the transfer request
    await prisma.activityLog.create({
      data: {
        userId: userSession.userId,
        action: "TRANSFER_REQUEST",
        details: `Requested transfer of ${asset.name} (${asset.tag}) to ${receiver.name}`,
      },
    });

    // Create Notification for Admin/Managers
    const adminsAndManagers = await prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "MANAGER"] },
      },
    });

    await Promise.all(
      adminsAndManagers.map((admin) =>
        prisma.notification.create({
          data: {
            userId: admin.id,
            title: "New Transfer Request",
            message: `${userSession.name} requested transfer of ${asset.name} to ${receiver.name}.`,
            type: "INFO",
          },
        })
      )
    );

    return NextResponse.json({ transfer });
  } catch (error) {
    console.error("Create transfer API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
