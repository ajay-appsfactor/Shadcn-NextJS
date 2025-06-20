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



// import { NextResponse } from 'next/server';
// import pool from '@/lib/db';

// export async function POST(req) {
//   try {
//     const { updatedRows } = await req.json();
//     console.log(first)

//     if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
//       return NextResponse.json(
//         { success: false, message: 'Invalid or empty updatedRows' },
//         { status: 400 }
//       );
//     }

//     // Validate input
//     for (const row of updatedRows) {
//       if (!row.id || typeof row.sort_order !== 'number') {
//         return NextResponse.json(
//           { success: false, message: 'Each row must have id and sort_order' },
//           { status: 400 }
//         );
//       }
//     }

//     const client = await pool.connect();
//     try {
//       await client.query('BEGIN');

//       // 1. Fetch all current sort_orders
//       const { rows: allCustomers } = await client.query(
//         'SELECT id, sort_order FROM customers ORDER BY sort_order ASC'
//       );

//       // Build a map of current sort_orders
//       const sortMap = new Map();
//       for (const row of allCustomers) {
//         sortMap.set(row.sort_order, row.id);
//       }

//       // 2. Detect duplicates in incoming `sort_order` values
//       const incomingSortOrders = new Set();
//       for (const row of updatedRows) {
//         if (incomingSortOrders.has(row.sort_order)) {
//           return NextResponse.json(
//             { success: false, message: `Duplicate sort_order in request: ${row.sort_order}` },
//             { status: 400 }
//           );
//         }
//         incomingSortOrders.add(row.sort_order);
//       }

//       // 3. Shift sort_orders if conflicts exist
//       for (const { id, sort_order } of updatedRows) {
//         // If another row has this sort_order, we need to shift it
//         const existingId = sortMap.get(sort_order);
//         if (existingId && existingId !== id) {
//           // Shift down the conflicting row
//           await client.query(
//             'UPDATE customers SET sort_order = sort_order + 1 WHERE sort_order >= $1 AND id != $2',
//             [sort_order, id]
//           );
//         }

//         // Now set the updated row
//         await client.query(
//           'UPDATE customers SET sort_order = $1 WHERE id = $2',
//           [sort_order, id]
//         );
//       }

//       await client.query('COMMIT');

//       return NextResponse.json({
//         success: true,
//         message: `Updated ${updatedRows.length} rows with unique sort_order`,
//       });

//     } catch (err) {
//       await client.query('ROLLBACK');
//       console.error("Transaction error:", err);
//       return NextResponse.json(
//         { success: false, message: 'Transaction failed' },
//         { status: 500 }
//       );
//     } finally {
//       client.release();
//     }

//   } catch (err) {
//     console.error("Server error:", err);
//     return NextResponse.json(
//       { success: false, message: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }
