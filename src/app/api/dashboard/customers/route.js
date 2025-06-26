import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { createToken } from "@/lib/auth";
import { cookieOptions } from "@/lib/cookieOptions";

// Customer Add in the Users and Custormers Table
export async function POST(req) {
  try {
    const body = await req.json();

    const {
      first_name,
      last_name,
      company,
      address,
      city,
      state,
      zip,
      country,
      phone,
      mobile,
      email,
      password,
      shipping_first_name,
      shipping_last_name,
      shipping_company,
      shipping_address,
      shipping_city,
      shipping_state,
      shipping_country,
      shipping_zip,
      shipping_phone,
      shipping_mobile,
      send_invoice,
      conformance,
      terms,
      freight,
      customer_note,
      quality_note,
      accounting_note,
      shipping_note,
      sales_note,
    } = body;

    console.log("customer body", body);

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

    const user = await prisma.users.create({
      data: {
        email: trimmedEmail,
        password: hashedPassword,
        first_name: first_name,
        last_name: last_name,
        customers: {
          create: {
            first_name: first_name,
            last_name: last_name,
            email: trimmedEmail,
            company,
            address,
            city,
            state,
            zip,
            country,
            phone,
            mobile: mobile || null,
            shipping_first_name: shipping_first_name || null,
            shipping_last_name: shipping_last_name || null,
            shipping_company: shipping_company || null,
            shipping_address: shipping_address || null,
            shipping_city: shipping_city || null,
            shipping_state: shipping_state || null,
            shipping_zip: shipping_zip || null,
            shipping_country: shipping_country || null,
            shipping_phone: shipping_phone || null,
            shipping_mobile: shipping_mobile || null,
            send_invoice: send_invoice || null,
            conformance: conformance || null,
            terms: terms || null,
            freight: freight || null,
            customer_note: customer_note || null,
            quality_note: quality_note || null,
            accounting_note: accounting_note || null,
            shipping_note: shipping_note || null,
            sales_note: sales_note || null,
            sorting: 0,
          },
        },
      },
    });

    const token = createToken({ id: user.id, email: user.email });

    const response = NextResponse.json(
      { message: "Customer added successfully" },
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
    console.error("Error in POST /api/dashboard/customers:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Get Fetch Data , searching, pagination, sort_order, total_count
export async function GET(req) {
  const { searchParams } = new URL(req.url);

  // Pagination
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") || "5"))
  );
  const skip = (page - 1) * limit;

  // Search
  const search = (searchParams.get("search") || "").trim();

  // Sorting
  const validSorts = [
    "id",
    "first_name",
    "last_name",
    "email",
    "company",
    "created_at",
    "sorting",
  ];

  const sortBy = validSorts.includes(searchParams.get("sortBy"))
    ? searchParams.get("sortBy")
    : "sorting";

  const orderDirection =
    searchParams.get("sortOrder")?.toLowerCase() === "desc" ? "desc" : "asc";

  try {
    // search filter
    const where = search
      ? {
          OR: [
            { first_name: { contains: search, mode: "insensitive" } },
            { last_name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { company: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    // Fetch paginated + sorted data
    const [customers, totalCount] = await Promise.all([
      prisma.customers.findMany({
        where,
        orderBy: { [sortBy]: orderDirection },
        skip,
        take: limit,
        select: {
          id: true,
          user_id: true,
          first_name: true,
          last_name: true,
          email: true,
          company: true,
          created_at: true,
        },
      }),
      prisma.customers.count({ where }),
    ]);

    return NextResponse.json({
      customers,
      totalCount,
      page,
      limit,
      hasMore: page * limit < totalCount,
    });
  } catch (error) {
    console.error("Error in GET /api/dashboard/customers:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
