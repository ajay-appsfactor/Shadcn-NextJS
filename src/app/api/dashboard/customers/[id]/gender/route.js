
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db"; 

export async function PATCH(req, { params }) {
  const { id } = await params;
  const { gender } = await req.json();

  const allowedGenders = ["MALE", "FEMALE", "OTHER", "UNKNOWN"];
  if (!allowedGenders.includes(gender)) {
    return NextResponse.json({ error: "Invalid gender" }, { status: 400 });
  }

  try {
    await pool.query("UPDATE customers SET gender = $1 WHERE id = $2", [gender, id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Gender update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
