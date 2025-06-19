import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";


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
      note
    } = data;

    // Hash the password (if provided)
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    // Create users table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        company VARCHAR(100),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100),
        zip VARCHAR(20),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert user
    const userResult = await pool.query(
      `INSERT INTO users (
        email, password, first_name, last_name, company,
        address, city, state, country, zip, phone
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11
      ) RETURNING id`,
      [
        email,
        hashedPassword,
        first_name,
        last_name,
        company,
        address,
        city,
        state,
        country,
        zip,
        phone,
      ]
    );

    const user = userResult.rows[0];
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
        user_id INTEGER REFERENCES users(id) NOT NULL,
        first_name TEXT,
        last_name TEXT,
        company TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zip TEXT,
        country TEXT,
        phone TEXT,
        mobile TEXT,
        email TEXT,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert customer
    const insertCustomerQuery = `
      INSERT INTO customers (
        user_id,
        first_name, last_name, company, address, city,
        state, zip, country, phone, mobile, email,
        shipping_firstname, shipping_lastname, shipping_company,
        shipping_address, shipping_city, shipping_state,
        shipping_zip, shipping_country, shipping_phone, shipping_mobile,
        sendinvoice, conformance, terms, freight, note
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12,
        $13, $14, $15,
        $16, $17, $18,
        $19, $20, $21, $22,
        $23, $24, $25, $26, $27
      ) RETURNING id
    `;

    const customerValues = [
      user.id,
      first_name,
      last_name,
      company,
      address,
      city,
      state,
      zip,
      country,
      phone || null,
      mobile || null,
      email,
      shipping_firstname || null,
      shipping_lastname || null,
      shipping_company || null,
      shipping_address || null,
      shipping_city || null,
      shipping_state || null,
      shipping_zip || null,
      shipping_country || null,
      shipping_phone || null,
      shipping_mobile || null,
      sendinvoice || null,
      conformance || null,
      terms || null,
      freight || null,
      note || null,
    ];

    const customerResult = await pool.query(insertCustomerQuery, customerValues);

    return NextResponse.json(
      {
        message: "Customer added successfully",
        customerId: customerResult.rows[0].id,
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


// export async function POST(req) {

//   try {
//     const data = await req.json();

//     const {
//       first_name,
//       last_name,
//       company,
//       address,
//       city,
//       state,
//       zip,
//       country,
//       phone,
//       mobile,
//       email,
//       password,
//       shipping_firstname,
//       shipping_lastname,
//       shipping_company,
//       shipping_address,
//       shipping_city,
//       shipping_state,
//       shipping_country,
//       shipping_zip,
//       shipping_phone,
//       shipping_mobile,
//       sendinvoice,
//       conformance,
//       terms,
//       freight,
//       note,
//     } = data;

//     // Hash password
//     const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

//     // User Table
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS users (
//         id SERIAL PRIMARY KEY,
//         email VARCHAR(100) UNIQUE NOT NULL,
//         password VARCHAR(100) NOT NULL,
//         first_name VARCHAR(100) NOT NULL,
//         last_name VARCHAR(100),
//         company VARCHAR(100),
//         address TEXT,
//         city VARCHAR(100),
//         state VARCHAR(100),
//         country VARCHAR(100),
//         zip VARCHAR(20),
//         phone VARCHAR(20),
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);

//     // Insert user
//     const userData = await pool.query(
//       `INSERT INTO users
//         (email, password, first_name, last_name, company, address, city, state, country, zip, phone)
//        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
//       [
//         email,
//         hashedPassword,
//         first_name,
//         last_name,
//         company,
//         address,
//         city,
//         state,
//         country,
//         zip,
//         phone,
//       ]
//     );

//     const user = userData.rows[0];
//     console.log("customer user:", userData);

//     if (!user) {
//       return NextResponse.json(
//         { error: "User could not be created" },
//         { status: 500 }
//       );
//     }

//     // Create customer table
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS customers (
//         id SERIAL PRIMARY KEY,
//         user_id INTEGER REFERENCES users(id) NOT NULL,
//         first_name TEXT,
//         last_name TEXT,
//         company TEXT,
//         address TEXT,
//         city TEXT,
//         state TEXT,
//         zip TEXT,
//         country TEXT,
//         phone TEXT,
//         mobile TEXT,
//         email TEXT,
//         password TEXT,
//         shipping_firstname TEXT,
//         shipping_lastname TEXT,
//         shipping_company TEXT,
//         shipping_address TEXT,
//         shipping_city TEXT,
//         shipping_state TEXT,
//         shipping_zip TEXT,
//         shipping_country TEXT,
//         shipping_phone TEXT,
//         shipping_mobile TEXT,
//         sendinvoice TEXT,
//         conformance TEXT,
//         terms TEXT,
//         freight TEXT,
//         note TEXT,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);

//     // Insert Query
//     const insertQuery = `
//       INSERT INTO customers (
//         user_id,
//         first_name, last_name, company, address, city,
//         state,zip, country, phone, mobile,
//         email, password,
//         shipping_firstname, shipping_lastname, shipping_company, shipping_address, shipping_city,
//         shipping_state, shipping_zip, shipping_country, shipping_phone, shipping_mobile,
//         sendinvoice, conformance, terms, freight, note
//       ) VALUES (
//         $1, $2, $3, $4, $5,
//         $6, $7, $8, $9, $10,
//         $11, $12,
//         $13, $14, $15, $16, $17,
//         $18, $19, $20, $21, $22,
//         $23, $24, $25, $26, $27
//       ) RETURNING id
//     `;

//     // values
//     const values = [
//       user.id,
//       first_name,
//       last_name,
//       company,
//       address,
//       city,
//       state,
//       zip,
//       country,
//       phone || null,
//       mobile || null,
//       email,
//       hashedPassword,
//       shipping_firstname || null,
//       shipping_lastname || null,
//       shipping_company || null,
//       shipping_address || null,
//       shipping_city || null,
//       shipping_state || null,
//       shipping_zip || null,
//       shipping_country || null,
//       shipping_phone || null,
//       shipping_mobile || null,
//       sendinvoice || null,
//       conformance || null,
//       terms || null,
//       freight || null,
//       note || null,
//     ];

//     const result = await pool.query(insertQuery, values);
//     console.log(result.rows[0]);

//     return NextResponse.json(
//       { message: "Customer added", customerId: result.rows[0].id },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("Error in add customer:", error.message);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// Pagination & Search



export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "5");
  const offset = (page - 1) * limit;

  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "sort_order";
  const sortOrder = searchParams.get("sortOrder") || "asc";

  // Validate allowed sort columns
  const validSorts = [
    "id",
    "first_name",
    "last_name",
    "email",
    "company",
    "created_at",
    "sort_order",
  ];
  const orderBy = validSorts.includes(sortBy) ? sortBy : "sort_order";
  const orderDirection = sortOrder === "desc" ? "DESC" : "ASC";

  try {
    const queryText = `
      SELECT *,sort_order FROM users
      WHERE 
        first_name ILIKE $1 OR 
        last_name ILIKE $1 OR 
        email ILIKE $1 OR 
        company ILIKE $1
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT $2 OFFSET $3
    `;
    const values = [`%${search}%`, limit, offset];
    const result = await pool.query(queryText, values);

    const countResult = await pool.query(
      `
      SELECT COUNT(*) FROM users
      WHERE 
        first_name ILIKE $1 OR 
        last_name ILIKE $1 OR 
        email ILIKE $1 OR 
        company ILIKE $1
    `,
      [`%${search}%`]
    );

    const totalCount = parseInt(countResult.rows[0].count);

    return Response.json({
      users: result.rows,
      totalCount,
    });
  } catch (err) {
    console.error("DB error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

