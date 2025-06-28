import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

// Extend the Request object to include our user property
interface AuthenticatedRequest extends Request {
  user?: { userId: string };
}

// Middleware-like function to verify token and attach user to request
async function verifyAuth(req: AuthenticatedRequest) {
  const token = cookies().get('fba_auth_token')?.value;

  if (!token) {
    return { error: 'Missing authentication token', status: 401 };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded as { userId: string };
    return { user: req.user };
  } catch (error) {
    return { error: 'Invalid or expired token', status: 403 };
  }
}

export async function GET(req: AuthenticatedRequest) {
  const authResult = await verifyAuth(req);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    await dbConnect();
    const user = await User.findById(authResult.user?.userId).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('GET /api/profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: AuthenticatedRequest) {
  const authResult = await verifyAuth(req);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const body = await req.json();
    
    // Fields that can be updated
    const { firstName, lastName, phone, company, location, timezone, bio, website } = body;

    await dbConnect();

    const updatedUser = await User.findByIdAndUpdate(
      authResult.user?.userId,
      {
        $set: {
          firstName,
          lastName,
          phone,
          company,
          location,
          timezone,
          bio,
          website,
        },
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('PUT /api/profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
