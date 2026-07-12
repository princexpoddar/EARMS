import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { signToken, TOKEN_COOKIE_NAME } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { name, email, password, departmentId } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = bcrypt.hashSync(password, saltRounds);

    // Create user. Default role is EMPLOYEE.
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: emailLower,
        passwordHash,
        role: "EMPLOYEE",
        departmentId: departmentId || null,
      },
      include: { department: true }
    });

    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
    };

    const token = signToken(payload);

    // Save signup log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "USER_SIGNUP",
        details: `${user.name} registered as an Employee`,
      },
    });

    // Send a welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Welcome to AssetFlow!",
        message: "You can now request assets, view items, and book conference resources.",
        type: "SUCCESS",
      },
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department?.name || null,
      },
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
