import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: any) {
  try {
    const userSession = getUserFromRequest(req);
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resources = await prisma.asset.findMany({
      where: {
        category: {
          type: "RESOURCE",
        },
        status: {
          not: "RETIRED",
        },
      },
      include: {
        category: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ resources });
  } catch (error) {
    console.error("Fetch resources API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
