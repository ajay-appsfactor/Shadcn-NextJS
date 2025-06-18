import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";

// Get Single User
export async function GET(request, { params }) {
  const { id } = await params;
  // console.log(id)

  try {
    const result = await pool.query(
      "SELECT * FROM customers WHERE user_id = $1",
      [id]
    );
    // console.log(result.rows)

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error("Error fetching customer by ID:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// Put Method
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    // console.log(id)
    const body = await request.json();

    const {
      email,
      first_name,
      last_name,
      company,
      address,
      city,
      state,
      country,
      zip,
      phone,
      mobile,
      sendinvoice,
      conformance,
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
      terms,
      freight,
      note,
      password,
    } = body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const updateQuery = `
      UPDATE customers SET
        email = $1, first_name = $2, last_name = $3, company = $4,
        address = $5, city = $6, state = $7, country = $8,
        zip = $9, phone = $10, mobile = $11, sendinvoice = $12,
        conformance = $13, shipping_firstname = $14, shipping_lastname = $15,
        shipping_company = $16, shipping_address = $17, shipping_city = $18,
        shipping_state = $19, shipping_country = $20, shipping_zip = $21,
        shipping_phone = $22, shipping_mobile = $23, terms = $24,
        freight = $25, note = $26, password = $27 
      WHERE user_id = $28
      RETURNING *
    `;

    const values = [
      email,
      first_name,
      last_name,
      company,
      address,
      city,
      state,
      country,
      zip,
      phone,
      mobile,
      sendinvoice,
      conformance,
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
      terms,
      freight,
      note,
      hashedPassword,
      id,
    ];

    const result = await pool.query(updateQuery, values);

    if (result.rowCount === 0) {
      return new Response(JSON.stringify({ message: "Customer not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result.rows[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
