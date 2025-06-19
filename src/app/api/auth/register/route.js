import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";

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
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user table
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

    // Insert user into table
    const result = await pool.query(
      `INSERT INTO users
        (email, password, first_name, last_name)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [trimmedEmail, hashedPassword, firstname, lastname]
    );

    const user = result.rows[0];
    console.log("Registered user:", user);

    if (!user) {
      return NextResponse.json(
        { error: "User could not be created" },
        { status: 500 }
      );
    }

    // Create customers table
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

    // Insert Into Customer Table
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
    firstname,
    lastname,
    trimmedEmail,
    company,
    address,
    city,
    state,
    zip,
    country,
    phone,
    null, 
    null, null, null, null, null,
    null, null, null, null, null,
    null, null, null, null, null,
    about || null,
    user.id, 
  ]
);

const CustomerData = customer.rows[0];
console.log("Customer data:", CustomerData); 

    // create a jwt token
    const token = createToken({ id: user.id, email: user.email });

    const response = NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      secure: false,
      maxAge: 60 * 60 * 24, // 1 day
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

