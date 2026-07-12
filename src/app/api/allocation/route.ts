import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const userSession = getUserFromRequest(req);
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only ADMIN and MANAGER can allocate assets
    if (userSession.role !== "ADMIN" && userSession.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const { assetId, userId } = await req.json();

    if (!assetId || !userId) {
      return NextResponse.json({ error: "Asset ID and User ID are required" }, { status: 400 });
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { department: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    // Check if asset exists and is AVAILABLE
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: { category: true }
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    if (asset.status !== "AVAILABLE") {
      return NextResponse.json({ error: `Asset is not available. Current status: ${asset.status}` }, { status: 400 });
    }

    // Check if category is resource (e.g. Conference Room)
    // Resources should not be allocated permanently, they must be booked!
    if (asset.category.type === "RESOURCE") {
      return NextResponse.json({ error: "Shared resources cannot be allocated. Use the booking system instead." }, { status: 400 });
    }

    // Allocate the asset
    const updatedAsset = await prisma.asset.update({
      where: { id: assetId },
      data: {
        status: "ALLOCATED",
        currentUserId: userId,
        departmentId: targetUser.departmentId,
      },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: userSession.userId,
        action: "ASSET_ALLOCATE",
        details: `Allocated asset ${asset.name} (${asset.tag}) to ${targetUser.name}`,
      },
    });

    // Notify the user
    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        title: "Asset Allocated",
        message: `Asset ${asset.name} (${asset.tag}) has been allocated to you by ${userSession.name}.`,
        type: "SUCCESS",
      },
    });

    return NextResponse.json({ asset: updatedAsset });
  } catch (error) {
    console.error("Allocate asset API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
