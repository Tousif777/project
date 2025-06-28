import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';

const ApiSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
});

const ApiSetting = mongoose.models.ApiSetting || mongoose.model('ApiSetting', ApiSettingsSchema);

// GET: Get all API settings
export async function GET() {
  await dbConnect();
  const settings = await ApiSetting.find({});
  return NextResponse.json(settings.map(s => ({ key: s.key, value: s.value })));
}

// PUT: Update or create API setting
export async function PUT(req: NextRequest) {
  await dbConnect();
  const { key, value } = await req.json();
  if (!key) return NextResponse.json({ error: 'Key is required' }, { status: 400 });
  const setting = await ApiSetting.findOneAndUpdate(
    { key },
    { value },
    { upsert: true, new: true }
  );
  return NextResponse.json({ key: setting.key, value: setting.value });
}
