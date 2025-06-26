import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const { updatedRows } = await req.json();

    if (!Array.isArray(updatedRows)) {
      return NextResponse.json(
        { success: false, message: 'Expected array of updated rows' },
        { status: 400 }
      );
    }

    if (updatedRows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No rows to update' },
        { status: 400 }
      );
    }

    // Validate each row
    for (const row of updatedRows) {
      if (!row.id || typeof row.sort_order !== 'number') {
        return NextResponse.json(
          { success: false, message: 'Each row must have a valid id and sort_order' },
          { status: 400 }
        );
      }
    }

    let updatedCount = 0;

    for (const row of updatedRows) {
      await prisma.customers.update({
        where: { id: row.id },
        data: { sorting: row.sort_order }, 
      });
      updatedCount++;
    }

    console.log(`Successfully updated ${updatedCount} rows`);
    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updatedCount} rows`,
      updatedCount,
    });

  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { success: false, message: 'Failed to update sort_order' },
      { status: 500 }
    );
  }
}

