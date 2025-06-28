import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

// GET: List all sub-admins
export async function GET() {
  await dbConnect();
  const subAdmins = await User.find({ role: { $in: ['sub-admin', 'viewer'] } }).select('-password');
  // Map _id to id for frontend, remove status and lastLogin
  const mapped = subAdmins.map((user: any) => {
    const obj = user.toObject();
    obj.id = obj._id.toString();
    delete obj._id;
    delete obj.status;
    delete obj.lastLogin;
    return obj;
  });
  return NextResponse.json(mapped);
}

// POST: Create a new sub-admin
export async function POST(req: NextRequest) {
  await dbConnect();
  const data = await req.json();
  if (!data.username || !data.email || !data.password) {
    return NextResponse.json({ error: 'Username, email, and password are required' }, { status: 400 });
  }
  const exists = await User.findOne({ $or: [ { username: data.username }, { email: data.email } ] });
  if (exists) {
    return NextResponse.json({ error: 'Username or email already exists' }, { status: 400 });
  }
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = new User({ ...data, password: hashedPassword, role: data.role || 'sub-admin' });
  await user.save();
  // Exclude password, status, lastLogin, and map _id to id
  const { password, _id, status, lastLogin, ...userObj } = user.toObject();
  return NextResponse.json({ ...userObj, id: _id.toString() });
}
