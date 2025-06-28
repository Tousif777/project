import { NextResponse } from 'next/server';
import { runFbaAutomation } from '@/lib/automation';

export async function POST() {
  const result = await runFbaAutomation();
  return NextResponse.json(result);
}
