import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Clear the authentication cookie
    cookies().set('fba_auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      expires: new Date(0),
      path: '/',
    });

    return NextResponse.json({ message: 'Logout successful' }, { status: 200 });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
