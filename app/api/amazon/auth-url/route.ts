import { NextRequest, NextResponse } from 'next/server';
import { getAmazonAuthUrl } from '@/lib/amazon-spapi-auth';

export async function GET(req: NextRequest) {
  const url = getAmazonAuthUrl();
  return NextResponse.json({ url });
}
