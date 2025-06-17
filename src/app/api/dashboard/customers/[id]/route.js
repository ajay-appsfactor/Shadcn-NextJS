import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Get Single User
export async function GET(request, { params }) {
  const { id } = await params;
  // console.log(id)

  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    console.log(result.rows)

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Error fetching customer by ID:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// Put Method
export async function PUT(request, { params }) {
  try {
    const { id } = await params; 
    const body = await request.json();
    
    const {
      email, first_name, last_name, company, address,
      city, state, country, zip, phone, mobile,
      sendinvoice, conformance, sfirstname, slastname,
      scompany, saddress, scity, sstate, scountry,
      szip, sphone, smobile, terms, freight, note
    } = body;

    const updateQuery = `
      UPDATE users SET
        email = $1, first_name = $2, last_name = $3, company = $4,
        address = $5, city = $6, state = $7, country = $8,
        zip = $9, phone = $10, mobile = $11, sendinvoice = $12,
        conformance = $13, sfirstname = $14, slastname = $15,
        scompany = $16, saddress = $17, scity = $18, sstate = $19,
        scountry = $20, szip = $21, sphone = $22, smobile = $23,
        terms = $24, freight = $25, note = $26, updated_at = NOW()
      WHERE id = $27
      RETURNING *
    `;

    const values = [
      email, first_name, last_name, company, address,
      city, state, country, zip, phone, mobile,
      sendinvoice, conformance, sfirstname, slastname,
      scompany, saddress, scity, sstate, scountry,
      szip, sphone, smobile, terms, freight, note, id
    ];

    const result = await pool.query(updateQuery, values);
    
    if (result.rowCount === 0) {
      return new Response(JSON.stringify({ message: 'Customer not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(JSON.stringify(result.rows[0]), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}