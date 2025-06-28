import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
});

const Setting = mongoose.models.Setting || mongoose.model('Setting', SettingsSchema);

// GET: Get all settings
export async function GET() {
  await dbConnect();
  const settings = await Setting.find({});
  return NextResponse.json(settings.map(s => ({ key: s.key, value: s.value })));
}

// PUT: Update or create a setting
export async function PUT(req: NextRequest) {
  await dbConnect();
  const { key, value } = await req.json();
  if (!key) return NextResponse.json({ error: 'Key is required' }, { status: 400 });
  const setting = await Setting.findOneAndUpdate(
    { key },
    { value },
    { upsert: true, new: true }
  );
  return NextResponse.json({ key: setting.key, value: setting.value });
}
