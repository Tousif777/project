import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Job from '@/models/Job';

export async function POST() {
  try {
    await dbConnect();
    const deleteResult = await Job.deleteMany({});
    return NextResponse.json({
      message: 'Automation history cleared successfully.',
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to clear history', details: error.message },
      { status: 500 }
    );
  }
}
