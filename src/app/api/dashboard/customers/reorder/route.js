import { NextResponse } from 'next/server';
import pool from '@/lib/db'; 

export async function POST(req) {
  try {
    const body = await req.json(); 

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const customer of body) {
        await client.query(
          'UPDATE customers SET "order" = $1 WHERE id = $2',
          [customer.order, customer.id]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return NextResponse.json({ message: 'Order updated' }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
