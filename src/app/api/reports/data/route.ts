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

    // Only Admin and Managers can access reports
    if (userSession.role !== "ADMIN" && userSession.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    // 1. Calculate overall utilization rate
    const totalAssets = await prisma.asset.count();
    const allocatedAssets = await prisma.asset.count({ where: { status: "ALLOCATED" } });
    const utilizationRate = totalAssets > 0 ? Math.round((allocatedAssets / totalAssets) * 100) : 0;

    // 2. Department Breakdown
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { assets: true },
        },
      },
    });

    const departmentBreakdown = departments.map((d) => ({
      name: d.name,
      value: d._count.assets,
    }));

    // 3. Status Breakdown
    const statusCounts = await prisma.asset.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const statusBreakdown = statusCounts.map((item) => ({
      name: item.status,
      value: item._count.id,
    }));

    const allStatuses = ["AVAILABLE", "ALLOCATED", "MAINTENANCE", "RETIRED"];
    allStatuses.forEach((status) => {
      if (!statusBreakdown.some((s) => s.name === status)) {
        statusBreakdown.push({ name: status, value: 0 });
      }
    });

    // 4. Maintenance Trends (past 6 months)
    const maintenanceList = await prisma.maintenance.findMany({
      select: {
        cost: true,
        createdAt: true,
      },
    });

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonthIndex = new Date().getMonth();
    const pastSixMonths = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(currentMonthIndex - 5 + i);
      return {
        month: months[d.getMonth()],
        monthNum: d.getMonth(),
        year: d.getFullYear(),
        cost: 0,
      };
    });

    maintenanceList.forEach((m) => {
      const createdDate = new Date(m.createdAt);
      const match = pastSixMonths.find(
        (p) => p.monthNum === createdDate.getMonth() && p.year === createdDate.getFullYear()
      );
      if (match) {
        match.cost += m.cost;
      }
    });

    const maintenanceTrends = pastSixMonths.map((p) => ({
      name: p.month,
      cost: p.cost,
    }));

    // 5. Booking Frequency per resource (e.g. how many times was Boardroom Alpha booked)
    const resources = await prisma.asset.findMany({
      where: {
        category: { type: "RESOURCE" },
      },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });

    const resourceUsage = resources.map((r) => ({
      name: r.name.split(" (")[0], // Shorten name
      bookings: r._count.bookings,
    }));

    return NextResponse.json({
      utilizationRate,
      statusBreakdown,
      departmentBreakdown,
      maintenanceTrends,
      resourceUsage,
    });
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
