import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { cookieOptions } from "@/lib/cookieOptions";

// Clean empty/undefined/null/blank string fields
const cleanInput = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([_, val]) =>
        val !== undefined &&
        val !== null &&
        (typeof val !== "string" || val.trim() !== "")
    )
  );

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      firstname,
      lastname,
      company,
      address,
      city,
      state,
      country,
      zip,
      phone,
      about,
    } = body;

    const trimmedEmail = email.trim().toLowerCase();

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already registered." },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User and Customer
    const user = await prisma.users.create({
      data: {
        email: trimmedEmail,
        password: hashedPassword,
        first_name: firstname,
        last_name: lastname,
        customers: {
          create: cleanInput({
            first_name: firstname,
            last_name: lastname,
            email: trimmedEmail,
            company,
            address,
            city,
            state,
            zip,
            country,
            phone,
            about,
            sorting: 0,
          }),
        },
      },
      include: { customers: true },
    });

    console.log("register user :", user);
    const token = createToken({ id: user.id, email: user.email });
    console.log("Token Register: ", token);

    const response = NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );

    response.cookies.set("token", token, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
