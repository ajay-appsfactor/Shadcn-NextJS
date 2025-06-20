import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";

// Get Single Customer
export async function GET(request, { params }) {
  const { id } = await params;
  console.log("customer id : ", id);

  try {
    const result = await pool.query(
      "SELECT * FROM customers WHERE user_id = $1",
      [id]
    );

    // console.log("Result data : ", result.rows);

    if (!result.rows || result.rows.length === 0) {
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

// Put Single Customer
export async function PUT(req, { params }) {
  const { id } = await params;
  const data = await req.json();

  const {
    first_name,
    last_name,
    email,
    password,
    company,
    address,
    city,
    state,
    zip,
    country,
    phone,
    mobile,
    shipping_firstname,
    shipping_lastname,
    shipping_company,
    shipping_address,
    shipping_city,
    shipping_state,
    shipping_zip,
    shipping_country,
    shipping_phone,
    shipping_mobile,
    sendinvoice,
    conformance,
    terms,
    freight,
    note,
    about,
  } = data;

  const trimmedEmail = email.trim().toLowerCase();

  try {
    // Get customer by user_id
    const customerResult = await pool.query(
      "SELECT * FROM customers WHERE user_id = $1",
      [id]
    );

    if (customerResult.rows.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const userId = customerResult.rows[0].user_id;

    // Hash password 
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Update users table (conditionally update password)
    if (hashedPassword) {
      await pool.query(
        `
        UPDATE users SET
          email = $1,
          first_name = $2,
          last_name = $3,
          password = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
      `,
        [trimmedEmail, first_name, last_name, hashedPassword, userId]
      );
    } else {
      await pool.query(
        `
        UPDATE users SET
          email = $1,
          first_name = $2,
          last_name = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `,
        [trimmedEmail, first_name, last_name, userId]
      );
    }

    // Update customers table
    const result = await pool.query(
      `
      UPDATE customers SET
        first_name = $1,
        last_name = $2,
        email = $3,
        company = $4,
        address = $5,
        city = $6,
        state = $7,
        zip = $8,
        country = $9,
        phone = $10,
        mobile = $11,
        shipping_firstname = $12,
        shipping_lastname = $13,
        shipping_company = $14,
        shipping_address = $15,
        shipping_city = $16,
        shipping_state = $17,
        shipping_zip = $18,
        shipping_country = $19,
        shipping_phone = $20,
        shipping_mobile = $21,
        sendinvoice = $22,
        conformance = $23,
        terms = $24,
        freight = $25,
        note = $26,
        about = $27,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $28
      RETURNING *
    `,
      [
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
        mobile,
        shipping_firstname,
        shipping_lastname,
        shipping_company,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_zip,
        shipping_country,
        shipping_phone,
        shipping_mobile,
        sendinvoice,
        conformance,
        terms,
        freight,
        note,
        about || null,
        userId,
      ]
    );

    const updatedCustomer = result.rows[0];

    return NextResponse.json(
      {
        message: "Customer updated successfully",
        customer: updatedCustomer,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

// Delete Single Customer
export async function DELETE(req, { params }) {
  const { id } = await params;
   console.log("Delete customer id : ", id);

  try {
    const customerRes = await pool.query(
      "SELECT * FROM customers WHERE user_id = $1",
      [id]
    );

    if (customerRes.rows.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    await pool.query("DELETE FROM customers WHERE user_id = $1", [id]);
    await pool.query("DELETE FROM users WHERE id = $1", [id]);

    return NextResponse.json(
      { message: "Customer deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}


