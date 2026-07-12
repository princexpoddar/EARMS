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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : undefined;

    // Build Prisma query filters
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { tag: { contains: search } },
        { serialNumber: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const assets = await prisma.asset.findMany({
      where,
      include: {
        category: true,
        department: true,
        currentUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ assets });
  } catch (error) {
    console.error("Fetch assets API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userSession = getUserFromRequest(req);
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only ADMIN and MANAGER can create assets
    if (userSession.role !== "ADMIN" && userSession.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { name, tag, categoryId, location, serialNumber, cost, purchaseDate, imageUrl } = body;

    if (!name || !tag || !categoryId || !location) {
      return NextResponse.json({ error: "Name, tag, category, and location are required" }, { status: 400 });
    }

    // Validate duplicate tag
    const existingAssetByTag = await prisma.asset.findUnique({
      where: { tag: tag.toUpperCase().trim() },
    });

    if (existingAssetByTag) {
      return NextResponse.json({ error: `Asset tag ${tag} already exists` }, { status: 400 });
    }

    // Create the asset
    const asset = await prisma.asset.create({
      data: {
        name: name.trim(),
        tag: tag.toUpperCase().trim(),
        categoryId,
        location: location.trim(),
        serialNumber: serialNumber?.trim() || null,
        cost: parseFloat(cost) || 0.0,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        imageUrl: imageUrl?.trim() || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=400&q=80",
        qrCode: tag.toUpperCase().trim(),
        status: "AVAILABLE",
      },
      include: {
        category: true,
      },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: userSession.userId,
        action: "ASSET_CREATE",
        details: `Created asset: ${asset.name} (${asset.tag})`,
      },
    });

    return NextResponse.json({ asset });
  } catch (error: any) {
    console.error("Create asset API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
