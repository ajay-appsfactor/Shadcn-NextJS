import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

// Get Single Customer
export async function GET(request, { params }) {
  const { id } = await params;
  const userId = parseInt(id, 10);
  console.log("Delete customer id:", userId);

  try {
    const customer = await prisma.customers.findFirst({
      where: { user_id: userId },
      select: {
        id: true,
        user_id: true,
        first_name: true,
        last_name: true,
        phone: true,
        email: true,
        company: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(customer, { status: 200 });
  } catch (error) {
    console.error("Error fetching customer by ID:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// Put Single Customer
export async function PUT(req, { params }) {
  const { id } = await params;
  const userId = parseInt(id, 10);
  const data = await req.json();
  console.log("Update customer id:", userId);

  const { first_name, last_name, email, company } = data;

  const trimmedEmail = email.trim().toLowerCase();

  try {
    // 1. Find the customer by user_id
    const customer = await prisma.customers.findFirst({
      where: { user_id: userId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // if (password) {
    //   const hashedPassword = await bcrypt.hash(password, 10);
    //   updateUserData.password = hashedPassword;
    // }

    // 2. Update the users table
    await prisma.users.update({
      where: { id: userId },
      data: {
        email: trimmedEmail,
        first_name,
        last_name,
        updated_at: new Date(),
      },
    });


        // 3. Update the customers table using customer ID
    const updatedCustomer = await prisma.customers.update({
      where: { id: customer.id }, 
      data: {
        first_name,
        last_name,
        email: trimmedEmail,
        company,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: "Customer updated successfully",
        customer: updatedCustomer,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

// Delete Single Customer
export async function DELETE(req, { params }) {
  const { id } = await params;
  const userId = parseInt(id, 10);
  console.log("Delete customer id:", id);

  try {
    const customer = await prisma.customers.findFirst({
      where: { user_id: userId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Delete customer and user
    await prisma.customers.delete({
      where: { id: customer.id },
    });

    await prisma.users.delete({
      where: { id: userId },
    });

    return NextResponse.json(
      { message: "Customer deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
