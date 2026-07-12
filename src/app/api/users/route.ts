import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: any) {
  try {
    const userSession = getUserFromRequest(req);
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: {
          select: { name: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Fetch users API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
