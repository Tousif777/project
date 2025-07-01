import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Job from '@/models/Job';

export async function GET() {
  try {
    await dbConnect();

    const recentJobs = await Job.find({
      status: { $in: ['completed', 'failed'] },
    })
      .sort({ updatedAt: -1 })
      .limit(10);

    return NextResponse.json(recentJobs);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch recent runs', details: error.message },
      { status: 500 }
    );
  }
}
