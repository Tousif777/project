import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

// GET: Get a sub-admin by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const user = await User.findById(params.id).select('-password');
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(user);
}

// PUT: Update a sub-admin
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const data = await req.json();
  // If password is provided and not empty, hash it; otherwise, don't update password
  let updateData = { ...data };
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  } else {
    delete updateData.password;
  }
  const user = await User.findByIdAndUpdate(params.id, updateData, { new: true }).select('-password');
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(user);
}

// DELETE: Delete a sub-admin
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const user = await User.findByIdAndDelete(params.id);
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
