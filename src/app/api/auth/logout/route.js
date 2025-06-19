import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function DELETE() {
  const cookieStore = await  cookies();
  cookieStore.set('token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });

  return NextResponse.json({ message: 'Logout successful' }, { status: 200 });
}
