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

    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Invalid prompt query" }, { status: 400 });
    }

    const trimmedPrompt = prompt.trim();
    const apiKey = process.env.GEMINI_API_KEY;

    let intent = "unknown";
    let tagParam = "";

    // 1. INTENT DETECTION (Use Gemini if key is set, otherwise use regex fallback)
    if (apiKey) {
      try {
        const detectionSystemPrompt = `You are the intent detector for AssetFlow ERP.
Analyze the user's natural language question and map it to exactly one of the following JSON schemas.
Supported intents:
- "laptops_hr": User wants to see all laptops/computers assigned to the Human Resources department.
- "custodian_tag": User wants to know who has a specific asset tag (e.g. AST-0005). Return the tag in "tag" field.
- "overdue_assets": User wants to list assets that are overdue or past their allocation/booking end dates.
- "pending_maintenance": User wants to see all maintenance requests currently pending approval.
- "idle_assets": User wants to see all available or idle assets.
- "highest_allocations": User wants to know which employee holds the highest number of allocated assets.
- "bookings_today": User wants to know how many resource bookings are scheduled for today.
- "operational_summary": User wants a general operational summary of the system.
- "unknown": None of the above match.

Output strictly valid JSON with this structure:
{"intent": "intent_name", "tag": "AST-XXXX" or ""}
Do not include any other markdown wrapper or comments. Just the raw JSON string.`;

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
                    { text: `${detectionSystemPrompt}\n\nUser Question: "${trimmedPrompt}"` },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const jsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const parsed = JSON.parse(jsonText.trim());
          intent = parsed.intent || "unknown";
          tagParam = parsed.tag || "";
        }
      } catch (e) {
        console.error("Gemini Intent Detection failed, falling back to Regex:", e);
      }
    }

    // Regex fallback if Gemini key is missing or failed
    if (intent === "unknown") {
      const lower = trimmedPrompt.toLowerCase();
      
      if (lower.includes("laptop") && (lower.includes("hr") || lower.includes("human resource"))) {
        intent = "laptops_hr";
      } else if (lower.includes("overdue") || lower.includes("past due")) {
        intent = "overdue_assets";
      } else if (lower.includes("pending maintenance") || (lower.includes("maintenance") && lower.includes("pending"))) {
        intent = "pending_maintenance";
      } else if (lower.includes("idle") || lower.includes("available")) {
        intent = "idle_assets";
      } else if (lower.includes("highest") || lower.includes("most") || lower.includes("highest number")) {
        intent = "highest_allocations";
      } else if (lower.includes("booking") && (lower.includes("today") || lower.includes("schedule"))) {
        intent = "bookings_today";
      } else if (lower.includes("summary") || lower.includes("report") || lower.includes("overview")) {
        intent = "operational_summary";
      } else {
        const tagMatch = lower.match(/(ast-\d+)/i);
        if (tagMatch) {
          intent = "custodian_tag";
          tagParam = tagMatch[1].toUpperCase();
        }
      }
    }

    // 2. QUERY THE DATABASE SAFELY VIA PRISMA
    let dbData: any = null;
    let markdownResponse = "";

    switch (intent) {
      case "laptops_hr": {
        // Query Laptops Category
        const laptopCategory = await prisma.category.findFirst({
          where: { name: { contains: "Laptop" } },
        });
        const hrDept = await prisma.department.findFirst({
          where: { name: { contains: "HR" } },
        });

        if (hrDept) {
          const hrUsers = await prisma.user.findMany({
            where: { departmentId: hrDept.id },
            select: { id: true },
          });
          const hrUserIds = hrUsers.map((u: { id: string }) => u.id);

          const assets = await prisma.asset.findMany({
            where: {
              categoryId: laptopCategory?.id,
              OR: [
                { departmentId: hrDept.id },
                { currentUserId: { in: hrUserIds } },
              ],
            },
            include: {
              currentUser: { select: { name: true } },
              department: { select: { name: true } },
            },
          });

          dbData = assets;
          if (assets.length === 0) {
            markdownResponse = "No laptops are currently allocated to the HR department.";
          } else {
            markdownResponse = `### Laptops allocated to HR Department\n\n| Asset Name | Tag | Status | Custodian | Location |\n| :--- | :--- | :---: | :--- | :--- |\n` +
              assets.map((a) => `| ${a.name} | **${a.tag}** | \`${a.status}\` | ${a.currentUser?.name || "Shared"} | ${a.location} |`).join("\n");
          }
        } else {
          markdownResponse = "HR department record not found in the database.";
        }
        break;
      }

      case "custodian_tag": {
        if (!tagParam) {
          const tagMatch = trimmedPrompt.match(/(ast-\d+)/i);
          tagParam = tagMatch ? tagMatch[1].toUpperCase() : "";
        }

        if (tagParam) {
          const asset = await prisma.asset.findUnique({
            where: { tag: tagParam },
            include: {
              currentUser: { select: { name: true, email: true } },
              department: { select: { name: true } },
              category: { select: { name: true } },
            },
          });

          dbData = asset;
          if (!asset) {
            markdownResponse = `Asset with tag **${tagParam}** was not found in the inventory registry.`;
          } else {
            markdownResponse = `### Asset Details: ${asset.name} (${asset.tag})\n` +
              `*   **Category**: ${asset.category.name}\n` +
              `*   **Status**: \`${asset.status}\`\n` +
              `*   **Custodian**: ${asset.currentUser ? `**${asset.currentUser.name}** (${asset.currentUser.email})` : "_None (Available)_"}\n` +
              `*   **Department**: ${asset.department?.name || "Shared Inventory"}\n` +
              `*   **Location**: ${asset.location}\n` +
              `*   **Asset Value**: ₹${asset.cost.toLocaleString()}`;
          }
        } else {
          markdownResponse = "Please specify an asset tag (e.g. AST-0005) in your query.";
        }
        break;
      }

      case "overdue_assets": {
        // Query bookings that are active but past their end date
        const activeBookings = await prisma.booking.findMany({
          where: {
            status: "APPROVED",
            endDate: { lt: new Date() },
          },
          include: {
            asset: { select: { name: true, tag: true } },
            user: { select: { name: true, email: true } },
          },
        });

        dbData = activeBookings;
        if (activeBookings.length === 0) {
          markdownResponse = "✅ No overdue resource reservations or overdue allocations detected.";
        } else {
          markdownResponse = `### Overdue Reservations & Allocations\n\n| Asset / Resource | Tag | Custodian | End Time | Status |\n| :--- | :--- | :--- | :--- | :---: |\n` +
            activeBookings.map((b) => `| ${b.asset.name} | **${b.asset.tag}** | ${b.user.name} | ${new Date(b.endDate).toLocaleDateString()} | \`OVERDUE\` |`).join("\n");
        }
        break;
      }

      case "pending_maintenance": {
        const tickets = await prisma.maintenance.findMany({
          where: { status: "PENDING" },
          include: {
            asset: { select: { name: true, tag: true } },
            reporter: { select: { name: true } },
          },
        });

        dbData = tickets;
        if (tickets.length === 0) {
          markdownResponse = "No maintenance tickets are currently pending approval.";
        } else {
          markdownResponse = `### Pending Maintenance Approvals\n\n| Asset | Tag | Reporter | Priority | Date Logged |\n| :--- | :--- | :--- | :--- | :--- |\n` +
            tickets.map((t) => `| ${t.asset.name} | **${t.asset.tag}** | ${t.reporter.name} | **${t.priority}** | ${new Date(t.createdAt).toLocaleDateString()} |`).join("\n");
        }
        break;
      }

      case "idle_assets": {
        const assets = await prisma.asset.findMany({
          where: { status: "AVAILABLE" },
          include: { category: { select: { name: true } } },
          take: 10, // Limit to 10 for readability
        });

        dbData = assets;
        if (assets.length === 0) {
          markdownResponse = "All assets are currently in use; no idle assets available.";
        } else {
          markdownResponse = `### Idle / Available Assets (Showing top 10)\n\n| Asset Name | Tag | Category | Location | Cost |\n| :--- | :--- | :--- | :--- | :--- |\n` +
            assets.map((a) => `| ${a.name} | **${a.tag}** | ${a.category.name} | ${a.location} | ₹${a.cost.toLocaleString()} |`).join("\n");
        }
        break;
      }

      case "highest_allocations": {
        const allocations = await prisma.asset.groupBy({
          by: ["currentUserId"],
          _count: { id: true },
          where: {
            status: "ALLOCATED",
            currentUserId: { not: null },
          },
        });

        if (allocations.length === 0) {
          markdownResponse = "No assets are currently allocated to any employees.";
        } else {
          // Sort to find max
          const sorted = allocations.sort((a, b) => b._count.id - a._count.id);
          const topAlloc = sorted[0];

          if (topAlloc.currentUserId) {
            const user = await prisma.user.findUnique({
              where: { id: topAlloc.currentUserId },
              include: { department: true },
            });

            dbData = { user, count: topAlloc._count.id };
            markdownResponse = `### Top Asset Custodian\n\n**${user?.name}** holds the highest number of active asset allocations in the enterprise:\n\n*   **Total Allocated Items**: ${topAlloc._count.id} assets\n*   **Department**: ${user?.department?.name || "Shared"}\n*   **Email**: ${user?.email}`;
          } else {
            markdownResponse = "No custodian calculations available.";
          }
        }
        break;
      }

      case "bookings_today": {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const bookings = await prisma.booking.findMany({
          where: {
            status: "APPROVED",
            startDate: { lte: endOfToday },
            endDate: { gte: startOfToday },
          },
          include: {
            asset: { select: { name: true, tag: true } },
            user: { select: { name: true } },
          },
        });

        dbData = bookings;
        if (bookings.length === 0) {
          markdownResponse = "No resource bookings scheduled for today.";
        } else {
          markdownResponse = `### Today's Resource Reservations (${bookings.length} active)\n\n| Purpose | Resource | Booked By | Timings |\n| :--- | :--- | :--- | :--- |\n` +
            bookings.map((b) => `| ${b.purpose} | ${b.asset.name} | ${b.user.name} | ${new Date(b.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(b.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} |`).join("\n");
        }
        break;
      }

      case "operational_summary": {
        const total = await prisma.asset.count();
        const allocated = await prisma.asset.count({ where: { status: "ALLOCATED" } });
        const maintenance = await prisma.asset.count({ where: { status: "MAINTENANCE" } });
        const available = await prisma.asset.count({ where: { status: "AVAILABLE" } });
        const pendingMaint = await prisma.maintenance.count({ where: { status: "PENDING" } });
        const pendingTransfers = await prisma.transferRequest.count({ where: { status: "PENDING" } });

        dbData = { total, allocated, maintenance, available, pendingMaint, pendingTransfers };

        markdownResponse = `### AssetFlow Enterprise Summary\n\nHere is a high-level operational summary of the system:\n\n*   **Total Active Inventory**: ${total} hardware items\n*   **Custodian Custody**: ${allocated} items active\n*   **Idle / Available**: ${available} items in reserve\n*   **Upkeep Operations**: ${maintenance} items in maintenance\n*   **Pending Actions**:\n    *   **${pendingMaint}** repairs awaiting schedule review\n    *   **${pendingTransfers}** peer custody transfer requests awaiting manager approval`;
        break;
      }

      default: {
        markdownResponse = `Hello **${userSession.name}**! I am your AI Asset Copilot. I can parse natural queries using your live records.

Try one of the quick prompts:
*   "Show all laptops assigned to HR"
*   "Who currently has AST-0005?"
*   "List overdue assets"
*   "Show pending maintenance requests"
*   "Show idle assets"
*   "Who has the highest number of allocated assets?"
*   "How many bookings are today?"
*   "Generate an operational summary"`;
        break;
      }
    }

    // 3. IF GEMINI IS ACTIVE, GENERATE CONTEXT-AWARE CONVERSATIONAL MARKDOWN
    if (apiKey && intent !== "unknown" && dbData) {
      try {
        const responseSystemPrompt = `You are the AI Asset Copilot for AssetFlow ERP, talking to ${userSession.name}.
We queried the database and found the following structured records matching the user's query.
Format these results into a highly professional, conversational markdown response.
Use bullet points, bold markers, and clean markdown tables where applicable.
Ensure all pricing is formatted as Indian Rupees (₹).
Do not mention "database" or "JSON" or "querying". Act as if you directly looked up the records.

Database Records:
${JSON.stringify(dbData, null, 2)}

User Question: "${trimmedPrompt}"`;

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
                    { text: responseSystemPrompt },
                  ],
                },
              ],
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const conversationalAnswer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (conversationalAnswer) {
            markdownResponse = conversationalAnswer.trim();
          }
        }
      } catch (e) {
        console.error("Gemini Conversational Format failed, using local markdown template:", e);
      }
    }

    return NextResponse.json({ markdown: markdownResponse });
  } catch (error) {
    console.error("AI Copilot API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
