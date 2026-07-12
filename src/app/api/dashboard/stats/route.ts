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

    // 1. Core KPIs
    const totalAssetsCount = await prisma.asset.count();
    const allocatedAssetsCount = await prisma.asset.count({ where: { status: "ALLOCATED" } });
    const maintenanceCount = await prisma.asset.count({ where: { status: "MAINTENANCE" } });
    const pendingTransfersCount = await prisma.transferRequest.count({ where: { status: "PENDING" } });

    // 2. Assets by status breakdown
    const statusCounts = await prisma.asset.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const statusBreakdown = statusCounts.map((item) => ({
      name: item.status,
      value: item._count.id,
    }));

    // Fill missing statuses if needed
    const allStatuses = ["AVAILABLE", "ALLOCATED", "MAINTENANCE", "RETIRED"];
    allStatuses.forEach((status) => {
      if (!statusBreakdown.some((s) => s.name === status)) {
        statusBreakdown.push({ name: status, value: 0 });
      }
    });

    // 3. Department-wise allocations
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { assets: true },
        },
      },
    });
    const departmentBreakdown = departments.map((d) => ({
      name: d.name,
      assets: d._count.assets,
    }));

    // 4. Maintenance Trends (resolved vs pending cost/count)
    const maintenanceList = await prisma.maintenance.findMany({
      select: {
        status: true,
        cost: true,
        createdAt: true,
      },
    });

    // Simple aggregation of costs by month (past 6 months)
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

    // 5. Recent Activity Logs
    const recentLogs = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

    // 6. Upcoming Resource Bookings
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        startDate: {
          gte: new Date(),
        },
        status: {
          in: ["PENDING", "APPROVED"],
        },
      },
      include: {
        asset: {
          select: {
            name: true,
            location: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { startDate: "asc" },
      take: 4,
    });

    return NextResponse.json({
      kpis: {
        totalAssets: totalAssetsCount,
        allocatedAssets: allocatedAssetsCount,
        maintenance: maintenanceCount,
        pendingTransfers: pendingTransfersCount,
      },
      statusBreakdown,
      departmentBreakdown,
      maintenanceTrends,
      recentLogs,
      upcomingBookings,
    });
  } catch (error) {
    console.error("Dashboard stats API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
