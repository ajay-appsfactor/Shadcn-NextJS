import { NextResponse } from 'next/server';
import pool from '@/lib/db';

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

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const row of updatedRows) {
        await client.query(
          'UPDATE customers SET sort_order = $1 WHERE id = $2',
          [row.sort_order, row.id]
        );
      }

      await client.query('COMMIT');

      console.log(`Successfully updated ${updatedRows.length} rows`);
      return NextResponse.json({
        success: true,
        message: `Successfully updated ${updatedRows.length} rows`,
        updatedCount: updatedRows.length
      });

    } catch (err) {
      await client.query('ROLLBACK');
      console.error("Transaction error:", err);
      return NextResponse.json(
        { success: false, message: 'Transaction failed' },
        { status: 500 }
      );
    } finally {
      client.release();
    }

  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { success: false, message: 'Failed to update order' },
      { status: 500 }
    );
  }
}
