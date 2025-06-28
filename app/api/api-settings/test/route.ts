import { NextRequest, NextResponse } from 'next/server';
import { testNextEngineConnection } from '@/lib/integrations/nextEngine';
import { testAmazonConnection } from '@/lib/integrations/amazon';
import { testGoogleSheetsConnection } from '@/lib/integrations/googleSheets';

export async function POST(req: NextRequest) {
  const { service, credentials } = await req.json();

  try {
    if (service === 'nextEngine') {
      const result = await testNextEngineConnection(credentials);
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }
    if (service === 'amazon') {
      const result = await testAmazonConnection(credentials);
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }
    if (service === 'google') {
      const result = await testGoogleSheetsConnection(credentials);
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }
    return NextResponse.json({ success: false, error: 'Unknown service' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Test failed' }, { status: 500 });
  }
}
