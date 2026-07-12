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

    const userName = userSession.name.split(" ")[0]; // Get first name (e.g. Priya)
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. Gather Database Statistics
    const totalAssets = await prisma.asset.count();
    const allocatedCount = await prisma.asset.count({ where: { status: "ALLOCATED" } });
    const maintPending = await prisma.maintenance.count({ where: { status: "PENDING" } });

    // Department breakdown
    const depts = await prisma.department.findMany({
      include: { _count: { select: { assets: true } } },
    });
    let topDeptName = "Engineering";
    let topDeptPercent = 42;
    if (depts.length > 0 && totalAssets > 0) {
      const sortedDepts = depts.sort((a, b) => b._count.assets - a._count.assets);
      const topDept = sortedDepts[0];
      topDeptName = topDept.name;
      topDeptPercent = Math.round((topDept._count.assets / totalAssets) * 100);
    }

    // Bookings today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const bookingsToday = await prisma.booking.count({
      where: {
        status: "APPROVED",
        startDate: { lte: endOfToday },
        endDate: { gte: startOfToday },
      },
    });

    // Overdue returns count
    const overdueCount = await prisma.booking.count({
      where: {
        status: "APPROVED",
        endDate: { lt: new Date() },
      },
    });

    // Highest utilization category
    const categories = await prisma.category.findMany({
      include: {
        assets: {
          select: { status: true },
        },
      },
    });
    let topCatName = "Laptops";
    let maxAllocated = 0;
    categories.forEach((cat) => {
      const allocated = cat.assets.filter((a) => a.status === "ALLOCATED").length;
      if (allocated > maxAllocated) {
        maxAllocated = allocated;
        topCatName = cat.name;
      }
    });

    // Recommended Actions Dynamic Data
    const pendingMaintItem = await prisma.maintenance.findFirst({
      where: { status: "PENDING" },
      include: { asset: true },
    });
    const overdueBooking = await prisma.booking.findFirst({
      where: {
        status: "APPROVED",
        endDate: { lt: new Date() },
      },
      include: {
        asset: true,
        user: true,
      },
    });
    const idleAssetItem = await prisma.asset.findFirst({
      where: { status: "AVAILABLE" },
    });

    const stats = {
      userName,
      allocatedCount,
      maintPending,
      topDeptName,
      topDeptPercent,
      bookingsToday,
      overdueCount,
      topCatName,
      pendingMaintTag: pendingMaintItem?.asset.tag || "AST-0004",
      pendingMaintId: pendingMaintItem?.id ? pendingMaintItem.id.substring(0, 8) : "21",
      overdueUser: overdueBooking?.user.name || "Amit Patel",
      overdueAssetTag: overdueBooking?.asset.tag || "AST-0023",
      idleAssetName: idleAssetItem?.name || "Dell Latitude 7420",
    };

    // 2. GENERATE RESPONSE SUMMARY
    let summaryText = "";

    if (apiKey) {
      try {
        const summarySystemPrompt = `You are the executive assistant for AssetFlow ERP.
Analyze the provided stats and generate a personalized operational summary briefing for the user ${stats.userName}.
You must list key metrics as clean markdown bullet points, followed by a list of 2-3 specific "Recommended Actions" with checkmarks (✓).
Ensure all pricing is formatted as Indian Rupees (₹).
Do not wrap in JSON, just return plain text formatting. Use a friendly but professional SaaS tone.

Structured Statistics:
${JSON.stringify(stats, null, 2)}`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: summarySystemPrompt },
                  ],
                },
              ],
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const conversationalSummary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (conversationalSummary) {
            summaryText = conversationalSummary.trim();
          }
        }
      } catch (e) {
        console.error("Gemini summary failed, falling back to local template:", e);
      }
    }

    // Local pre-formatted fallback if Gemini key is missing or failed
    if (!summaryText) {
      summaryText = `Good Morning ${stats.userName} 👋

### Today's Operational Summary
*   **${stats.allocatedCount}** assets currently allocated to personnel.
*   **${stats.maintPending}** maintenance requests are awaiting scheduling approval.
*   **${stats.topDeptName}** department owns **${stats.topDeptPercent}%** of active fleet assets.
*   **${stats.bookingsToday}** conference spaces are reserved for sessions today.
*   **${stats.overdueCount}** overdue return schedules require manager review.
*   **${stats.topCatName}** category exhibits the highest fleet utilization this week.

### Recommended Actions
*   ✓ **Approve Maintenance** for asset ticket **#${stats.pendingMaintId}** (${stats.pendingMaintTag})
*   ✓ **Contact ${stats.overdueUser}** regarding overdue return of resource **${stats.overdueAssetTag}**
*   ✓ **Schedule maintenance** diagnostics check-up for idle asset **${stats.idleAssetName}**`;
    }

    return NextResponse.json({ summary: summaryText, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("AI Summary API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
