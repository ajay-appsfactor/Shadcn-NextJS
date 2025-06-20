import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

// Add Customer
export async function POST(req) {
  try {
    const data = await req.json();

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
      about,
      shipping_firstname,
      shipping_lastname,
      shipping_company,
      shipping_address,
      shipping_city,
      shipping_state,
      shipping_country,
      shipping_zip,
      shipping_phone,
      shipping_mobile,
      sendinvoice,
      conformance,
      terms,
      freight,
      note,
    } = data;

    const trimmedEmail = email.trim().toLowerCase();

    // existingUser if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [trimmedEmail]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: "Email is already registered." },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    // Create users table if not exists
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users ( 
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

    `);

    // Insert user
    const userResult = await pool.query(
      `INSERT INTO users (
        email, password, first_name, last_name
      ) VALUES (
        $1, $2, $3, $4
      ) RETURNING id`,
      [trimmedEmail, hashedPassword, first_name, last_name]
    );

    const user = userResult.rows[0];
    console.log("Registered user:", user);

    if (!user) {
      return NextResponse.json(
        { error: "User could not be created" },
        { status: 500 }
      );
    }

    // Create customers table if not exists
    await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE ,
    company TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    country TEXT,
    phone TEXT,
    mobile TEXT,
    shipping_firstname TEXT,
    shipping_lastname TEXT,
    shipping_company TEXT,
    shipping_address TEXT,
    shipping_city TEXT,
    shipping_state TEXT,
    shipping_zip TEXT,
    shipping_country TEXT,
    shipping_phone TEXT,
    shipping_mobile TEXT,
    sendinvoice TEXT,
    conformance TEXT,
    terms TEXT,
    freight TEXT,
    note TEXT,
    about VARCHAR(200),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
    `);

    // Insert customer
    const customer = await pool.query(
      `INSERT INTO customers (
    user_id,
    first_name, last_name, email, company, address, city,
    state, zip, country, phone, mobile,
    shipping_firstname, shipping_lastname, shipping_company, shipping_address, shipping_city,
    shipping_state, shipping_zip, shipping_country, shipping_phone, shipping_mobile,
    sendinvoice, conformance, terms, freight, note, about, sort_order
  ) VALUES (
    $1, $2, $3, $4, $5, $6, $7,
    $8, $9, $10, $11, $12, $13,
    $14, $15, $16, $17, $18,
    $19, $20, $21, $22, $23,
    $24, $25, $26, $27, $28, $29
  ) RETURNING *`,
      [
        user.id,
        first_name,
        last_name,
        trimmedEmail,
        company,
        address,
        city,
        state,
        zip,
        country,
        phone,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        about || null,
        0,
      ]
    );

    const CustomerData = customer.rows[0];
    console.log("Customer data:", CustomerData);

    return NextResponse.json(
      {
        message: "Customer added successfully",
        customerId: CustomerData.id,
      },
      { status: 201 }
    );
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

  // Parse and validate pagination parameters
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") || "5"))
  );
  const offset = (page - 1) * limit;

  // Search term - trim and escape special characters
  const search = (searchParams.get("search") || "").trim();
  const searchTerm = `%${search.replace(/[\\%_]/g, "\\$&")}%`;

  // Sorting parameters with validation
  const validSorts = [
    "id",
    "first_name",
    "last_name",
    "email",
    "company",
    "created_at",
    "sort_order",
  ];
  // const sortBy = validSorts.includes(searchParams.get("sortBy"))
  //   ? searchParams.get("sortBy")
  //   : "created_at";
  // const orderDirection =
  //   searchParams.get("sortOrder") || (sortBy === "created_at" ? "desc" : "ASC");

  const sortBy = validSorts.includes(searchParams.get("sortBy"))
    ? searchParams.get("sortBy")
    : "sort_order";

  const orderDirection =
    searchParams.get("sortOrder") === "desc" ? "DESC" : "ASC";

  try {
    // Base query for both data and count
    const baseQuery = `
      FROM customers
      WHERE 
        ($1 = '' OR 
         first_name ILIKE $1 OR 
         last_name ILIKE $1 OR 
         email ILIKE $1 OR 
         company ILIKE $1)
    `;

    // Get paginated results
    const dataQuery = `
      SELECT *, sort_order 
      ${baseQuery}
      ORDER BY ${sortBy} ${orderDirection}
      LIMIT $2 OFFSET $3
    `;

    // Get total count
    const countQuery = `SELECT COUNT(*) ${baseQuery}`;

    // Execute both queries in parallel
    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery, [searchTerm, limit, offset]),
      pool.query(countQuery, [searchTerm]),
    ]);

    const totalCount = parseInt(countResult.rows[0].count);

    return Response.json({
      users: dataResult.rows,
      totalCount,
      page,
      limit,
      hasMore: page * limit < totalCount,
    });
  } catch (err) {
    console.error("DB error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// export async function GET(req) {
//   const { searchParams } = new URL(req.url);

//   const page = parseInt(searchParams.get("page") || "1");
//   const limit = parseInt(searchParams.get("limit") || "5");
//   const offset = (page - 1) * limit;

//   const search = searchParams.get("search") || "";
//   // const sortBy = searchParams.get("sortBy") || "created_at";
//   // const sortOrder = searchParams.get("sortOrder") || "desc";

//   const sortBy = searchParams.get("sortBy") || "sort_order";
//   const sortOrder = searchParams.get("sortOrder") || "asc";

//   // Validate allowed sort columns
//   const validSorts = [
//     "id",
//     "first_name",
//     "last_name",
//     "email",
//     "company",
//     "created_at",
//     "sort_order",
//   ];

//   const orderBy = validSorts.includes(sortBy) ? sortBy : "created_at";

//   //  const orderBy = validSorts.includes(sortBy) ? sortBy : "sort_order";
//   const orderDirection = sortOrder === "desc" ? "DESC" : "ASC";

//   try {
//     const queryText = `
//       SELECT *,sort_order FROM customers
//       WHERE
//         first_name ILIKE $1 OR
//         last_name ILIKE $1 OR
//         email ILIKE $1 OR
//         company ILIKE $1
//       ORDER BY ${orderBy} ${orderDirection}
//       LIMIT $2 OFFSET $3
//     `;
//     const values = [`%${search}%`, limit, offset];
//     const result = await pool.query(queryText, values);

//     const countResult = await pool.query(
//       `
//       SELECT COUNT(*) FROM customers
//       WHERE
//         first_name ILIKE $1 OR
//         last_name ILIKE $1 OR
//         email ILIKE $1 OR
//         company ILIKE $1
//     `,
//       [`%${search}%`]
//     );

//     const totalCount = parseInt(countResult.rows[0].count);

//     return Response.json({
//       users: result.rows,
//       totalCount,
//     });
//   } catch (err) {
//     console.error("DB error:", err);
//     return new Response("Internal Server Error", { status: 500 });
//   }
// }
