import { NextResponse } from 'next/server';
import { runFbaAutomation } from '@/lib/automation';
import { addJob, completeJob, failJob, updateJobStatus } from '@/lib/queue';

export async function POST() {
  const job = await addJob();

  // Run the automation in the background.
  // We don't await this IIFE, so the response is sent immediately.
  (async () => {
    await updateJobStatus(job.id, 'processing');
    try {
      const result = await runFbaAutomation();
      await completeJob(job.id, result);
    } catch (error: any) {
      await failJob(job.id, error.message || 'Automation failed');
    }
  })();

  return NextResponse.json({ jobId: job.id }, { status: 202 });
}
