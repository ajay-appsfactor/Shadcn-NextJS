import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";
import { cookieOptions } from "@/lib/cookieOptions";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const trimmedEmail = email.trim().toLowerCase();

    // 🔍 Check if user exists in database
    const user = await prisma.users.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Compare password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = createToken({ id: user.id, email: user.email });

    const response = NextResponse.json(
      { message: "Login successful" },
      { status: 200 }
    );

    // Set auth token in cookie
    response.cookies.set("token", token, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
