import { prisma } from "../src/lib/prisma";
import bcrypt from "bcrypt";

async function main() {
  console.log("Cleaning database...");
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.transferRequest.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  console.log("Seeding departments...");
  const engineering = await prisma.department.create({ data: { name: "Engineering" } });
  const design = await prisma.department.create({ data: { name: "Design" } });
  const hr = await prisma.department.create({ data: { name: "Human Resources" } });
  const sales = await prisma.department.create({ data: { name: "Sales" } });
  const operations = await prisma.department.create({ data: { name: "Operations" } });

  console.log("Seeding categories...");
  const laptops = await prisma.category.create({ data: { name: "Laptops", type: "ASSET", description: "Workstation laptops for employees" } });
  const monitors = await prisma.category.create({ data: { name: "Monitors", type: "ASSET", description: "Display monitors and screens" } });
  const mobile = await prisma.category.create({ data: { name: "Mobile Devices", type: "ASSET", description: "Company smartphones and tablets" } });
  const furniture = await prisma.category.create({ data: { name: "Office Furniture", type: "ASSET", description: "Desks, chairs, and physical furniture" } });
  const rooms = await prisma.category.create({ data: { name: "Conference Rooms", type: "RESOURCE", description: "Shared meeting rooms and spaces" } });
  const equipment = await prisma.category.create({ data: { name: "AV Equipment", type: "RESOURCE", description: "Projectors, TV screens, and microphones" } });

  console.log("Seeding users...");
  const saltRounds = 10;
  const adminPassword = bcrypt.hashSync("admin123", saltRounds);
  const managerPassword = bcrypt.hashSync("manager123", saltRounds);
  const employeePassword = bcrypt.hashSync("employee123", saltRounds);

  const admin = await prisma.user.create({
    data: {
      email: "admin@assetflow.com",
      name: "Priya Sharma (Admin)",
      role: "ADMIN",
      passwordHash: adminPassword,
      departmentId: operations.id,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: "manager@assetflow.com",
      name: "Rajesh Kumar (Manager)",
      role: "MANAGER",
      passwordHash: managerPassword,
      departmentId: engineering.id,
    },
  });

  const employee1 = await prisma.user.create({
    data: {
      email: "employee@assetflow.com",
      name: "Amit Patel",
      role: "EMPLOYEE",
      passwordHash: employeePassword,
      departmentId: engineering.id,
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      email: "designer@assetflow.com",
      name: "Sneha Reddy",
      role: "EMPLOYEE",
      passwordHash: employeePassword,
      departmentId: design.id,
    },
  });

  const employee3 = await prisma.user.create({
    data: {
      email: "hr@assetflow.com",
      name: "Deepak Sharma",
      role: "EMPLOYEE",
      passwordHash: employeePassword,
      departmentId: hr.id,
    },
  });

  console.log("Seeding assets...");
  // MacBook Pro 16"
  const mbp = await prisma.asset.create({
    data: {
      name: "MacBook Pro 16\" (M3 Max, 64GB)",
      tag: "AST-0001",
      categoryId: laptops.id,
      status: "ALLOCATED",
      location: "San Francisco - Head Office",
      serialNumber: "C02F1234Q05D",
      purchaseDate: new Date("2026-01-15"),
      cost: 3499.00,
      departmentId: engineering.id,
      currentUserId: employee1.id,
      imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80",
      qrCode: "AST-0001",
    },
  });

  // Dell XPS 15
  const dell = await prisma.asset.create({
    data: {
      name: "Dell XPS 15 (i9, 32GB)",
      tag: "AST-0002",
      categoryId: laptops.id,
      status: "AVAILABLE",
      location: "San Francisco - Head Office",
      serialNumber: "D39F5678X12A",
      purchaseDate: new Date("2026-02-10"),
      cost: 2199.00,
      departmentId: operations.id,
      imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=400&q=80",
      qrCode: "AST-0002",
    },
  });

  // iPhone 15 Pro
  const iphone = await prisma.asset.create({
    data: {
      name: "iPhone 15 Pro Max 512GB",
      tag: "AST-0003",
      categoryId: mobile.id,
      status: "ALLOCATED",
      location: "New York Hub",
      serialNumber: "F9H348FHEU3F",
      purchaseDate: new Date("2025-11-20"),
      cost: 1199.00,
      departmentId: sales.id,
      currentUserId: manager.id,
      imageUrl: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=400&q=80",
      qrCode: "AST-0003",
    },
  });

  // iPad Pro (Maintenance)
  const ipad = await prisma.asset.create({
    data: {
      name: "iPad Pro 12.9\" (M2, 256GB)",
      tag: "AST-0004",
      categoryId: mobile.id,
      status: "MAINTENANCE",
      location: "San Francisco - Head Office",
      serialNumber: "P98FJD8E8FJE",
      purchaseDate: new Date("2025-08-05"),
      cost: 1099.00,
      departmentId: design.id,
      currentUserId: employee2.id,
      imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=400&q=80",
      qrCode: "AST-0004",
    },
  });

  // Herman Miller Aeron Chair
  const aeron = await prisma.asset.create({
    data: {
      name: "Herman Miller Aeron Chair (Size B)",
      tag: "AST-0005",
      categoryId: furniture.id,
      status: "ALLOCATED",
      location: "San Francisco - Floor 3",
      serialNumber: "HM-AERON-98234",
      purchaseDate: new Date("2024-05-12"),
      cost: 1450.00,
      departmentId: engineering.id,
      currentUserId: employee1.id,
      imageUrl: "https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?auto=format&fit=crop&w=400&q=80",
      qrCode: "AST-0005",
    },
  });

  // Conference Room (Resource)
  const confRoom = await prisma.asset.create({
    data: {
      name: "Boardroom Alpha (12 Pax, AV Suite)",
      tag: "AST-0006",
      categoryId: rooms.id,
      status: "AVAILABLE",
      location: "San Francisco - Floor 5",
      purchaseDate: new Date("2024-01-01"),
      cost: 0.0,
      imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80",
      qrCode: "AST-0006",
    },
  });

  // Focus Room B (Resource)
  const focusRoom = await prisma.asset.create({
    data: {
      name: "Focus Pod B (1 Person)",
      tag: "AST-0007",
      categoryId: rooms.id,
      status: "AVAILABLE",
      location: "San Francisco - Floor 2",
      purchaseDate: new Date("2024-01-01"),
      cost: 0.0,
      imageUrl: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=400&q=80",
      qrCode: "AST-0007",
    },
  });

  // 4K Laser Projector
  const projector = await prisma.asset.create({
    data: {
      name: "Epson 4K Laser Projector Pro",
      tag: "AST-0008",
      categoryId: equipment.id,
      status: "AVAILABLE",
      location: "AV Equipment Storage Room",
      serialNumber: "EP-PRO-4K-9812",
      purchaseDate: new Date("2025-06-25"),
      cost: 1899.00,
      imageUrl: "https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=400&q=80",
      qrCode: "AST-0008",
    },
  });

  console.log("Seeding maintenance tickets...");
  await prisma.maintenance.create({
    data: {
      assetId: ipad.id,
      reporterId: employee2.id,
      description: "Screen flicker issues and loose charging port. Needs screen refitting and battery health check.",
      priority: "HIGH",
      status: "IN_PROGRESS",
      cost: 150.00,
      scheduledDate: new Date("2026-07-10"),
      comments: "Sent to Apple Authorized Service Provider. Awaiting parts.",
    },
  });

  await prisma.maintenance.create({
    data: {
      assetId: mbp.id,
      reporterId: employee1.id,
      description: "Keyboard has 2 keys sticking ('E' and 'R'). Cleaning scheduled.",
      priority: "LOW",
      status: "PENDING",
      cost: 0.00,
    },
  });

  await prisma.maintenance.create({
    data: {
      assetId: dell.id,
      reporterId: manager.id,
      description: "Battery swelling replacement. Battery safety issue.",
      priority: "CRITICAL",
      status: "APPROVED",
      cost: 200.00,
      scheduledDate: new Date("2026-07-14"),
      comments: "Approved by Rajesh Kumar. Battery ordered.",
    },
  });

  console.log("Seeding conference room bookings...");
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Past Booking (Completed)
  const pastStart = new Date(today);
  pastStart.setDate(today.getDate() - 2);
  pastStart.setHours(10, 0, 0, 0);
  const pastEnd = new Date(pastStart);
  pastEnd.setHours(12, 0, 0, 0);

  await prisma.booking.create({
    data: {
      assetId: confRoom.id,
      userId: employee2.id,
      startDate: pastStart,
      endDate: pastEnd,
      purpose: "Design Review Session",
      status: "COMPLETED",
    },
  });

  // Tomorrow Booking (Approved)
  const futStart = new Date(tomorrow);
  futStart.setHours(14, 0, 0, 0);
  const futEnd = new Date(futStart);
  futEnd.setHours(16, 0, 0, 0);

  await prisma.booking.create({
    data: {
      assetId: confRoom.id,
      userId: employee1.id,
      startDate: futStart,
      endDate: futEnd,
      purpose: "Sprint Planning",
      status: "APPROVED",
    },
  });

  // Pending Booking
  const pendStart = new Date(tomorrow);
  pendStart.setHours(10, 0, 0, 0);
  const pendEnd = new Date(pendStart);
  pendEnd.setHours(11, 30, 0, 0);

  await prisma.booking.create({
    data: {
      assetId: confRoom.id,
      userId: employee3.id,
      startDate: pendStart,
      endDate: pendEnd,
      purpose: "HR Onboarding Workshop",
      status: "PENDING",
    },
  });

  console.log("Seeding transfer requests...");
  await prisma.transferRequest.create({
    data: {
      assetId: dell.id,
      senderId: admin.id,
      receiverId: employee3.id,
      targetDepartmentId: hr.id,
      status: "PENDING",
      notes: "Need extra testing laptop for HR portal onboarding validations.",
    },
  });

  console.log("Seeding notifications...");
  await prisma.notification.create({
    data: {
      userId: admin.id,
      title: "New Transfer Request",
      message: "Rajesh requested to transfer Dell XPS 15 (AST-0002) to HR department.",
      type: "INFO",
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: employee1.id,
      title: "Booking Approved",
      message: "Your booking for Boardroom Alpha on " + tomorrow.toLocaleDateString() + " has been approved.",
      type: "SUCCESS",
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: employee2.id,
      title: "Maintenance In Progress",
      message: "iPad Pro (AST-0004) has been moved to maintenance status.",
      type: "WARNING",
      read: true,
    },
  });

  console.log("Seeding activity logs...");
  await prisma.activityLog.create({
    data: { userId: admin.id, action: "USER_LOGIN", details: "Priya Sharma logged in from 192.168.1.15" },
  });
  await prisma.activityLog.create({
    data: { userId: admin.id, action: "ASSET_CREATE", details: "Created asset MacBook Pro 16\" (AST-0001)" },
  });
  await prisma.activityLog.create({
    data: { userId: admin.id, action: "ASSET_ALLOCATE", details: "Allocated MacBook Pro 16\" (AST-0001) to Amit Patel" },
  });
  await prisma.activityLog.create({
    data: { userId: employee2.id, action: "MAINTENANCE_REQUEST", details: "Sneha Reddy requested maintenance for iPad Pro (AST-0004)" },
  });
  await prisma.activityLog.create({
    data: { userId: manager.id, action: "MAINTENANCE_APPROVE", details: "Rajesh Kumar approved maintenance for iPad Pro (AST-0004)" },
  });

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
