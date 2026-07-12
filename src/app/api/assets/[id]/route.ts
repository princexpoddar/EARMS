import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userSession = getUserFromRequest(req);
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        department: true,
        currentUser: {
          select: { id: true, name: true, email: true },
        },
        bookings: {
          orderBy: { startDate: "desc" },
          take: 5,
          include: {
            user: { select: { name: true } },
          },
        },
        maintenance: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            reporter: { select: { name: true } },
          },
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({ asset });
  } catch (error) {
    console.error("Fetch asset detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userSession = getUserFromRequest(req);
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only ADMIN and MANAGER can modify assets
    if (userSession.role !== "ADMIN" && userSession.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { name, categoryId, location, serialNumber, cost, purchaseDate, status, imageUrl } = body;

    const existingAsset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!existingAsset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Update the asset
    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        categoryId: categoryId !== undefined ? categoryId : undefined,
        location: location !== undefined ? location.trim() : undefined,
        serialNumber: serialNumber !== undefined ? (serialNumber?.trim() || null) : undefined,
        cost: cost !== undefined ? parseFloat(cost) : undefined,
        purchaseDate: purchaseDate !== undefined ? new Date(purchaseDate) : undefined,
        status: status !== undefined ? status : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl.trim() : undefined,
      },
    });

    // Log the change
    await prisma.activityLog.create({
      data: {
        userId: userSession.userId,
        action: "ASSET_UPDATE",
        details: `Updated asset: ${updatedAsset.name} (${updatedAsset.tag})`,
      },
    });

    return NextResponse.json({ asset: updatedAsset });
  } catch (error) {
    console.error("Update asset API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userSession = getUserFromRequest(req);
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only ADMIN and MANAGER can delete assets
    if (userSession.role !== "ADMIN" && userSession.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const { id } = await context.params;

    const existingAsset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!existingAsset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Perform actual deletion (or soft delete if we just change status to RETIRED)
    // For a robust implementation, let's delete the asset. But wait, if it has bookings/maintenance related to it,
    // deleting it straight will throw SQL foreign key error. So let's delete related bookings/maintenance first, or soft delete!
    // Soft deleting (setting status to RETIRED) is highly recommended for ERP audit logs! Let's do that!
    const retiredAsset = await prisma.asset.update({
      where: { id },
      data: { status: "RETIRED" },
    });

    // Log the deletion
    await prisma.activityLog.create({
      data: {
        userId: userSession.userId,
        action: "ASSET_RETIRE",
        details: `Retired asset: ${existingAsset.name} (${existingAsset.tag})`,
      },
    });

    return NextResponse.json({ success: true, asset: retiredAsset });
  } catch (error) {
    console.error("Retire asset API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
