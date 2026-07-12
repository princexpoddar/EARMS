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

    // Role check: Only ADMIN and MANAGER can process returns
    if (userSession.role !== "ADMIN" && userSession.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const { assetId } = await req.json();

    if (!assetId) {
      return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
    }

    // Fetch the asset
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: { currentUser: true },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    if (asset.status !== "ALLOCATED" && asset.status !== "MAINTENANCE") {
      return NextResponse.json({ error: `Asset is not currently checked out. Status: ${asset.status}` }, { status: 400 });
    }

    const previousCustodian = asset.currentUser;

    // Reset asset to AVAILABLE
    const updatedAsset = await prisma.asset.update({
      where: { id: assetId },
      data: {
        status: "AVAILABLE",
        currentUserId: null,
      },
    });

    // Log the return
    await prisma.activityLog.create({
      data: {
        userId: userSession.userId,
        action: "ASSET_RETURN",
        details: `Returned asset ${asset.name} (${asset.tag}) ${
          previousCustodian ? `from custodian ${previousCustodian.name}` : ""
        }`,
      },
    });

    // Notify the previous custodian
    if (previousCustodian) {
      await prisma.notification.create({
        data: {
          userId: previousCustodian.id,
          title: "Asset Returned",
          message: `Asset ${asset.name} (${asset.tag}) has been marked as returned by ${userSession.name}.`,
          type: "INFO",
        },
      });
    }

    return NextResponse.json({ asset: updatedAsset });
  } catch (error) {
    console.error("Return asset API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
