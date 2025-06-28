import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

// PATCH: Toggle sub-admin status
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const user = await User.findById(params.id);
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  user.status = user.status === 'active' ? 'inactive' : 'active';
  await user.save();
  return NextResponse.json({ success: true, status: user.status });
}
