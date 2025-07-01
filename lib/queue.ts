import dbConnect from './db';
import Job, { IJob } from '@/models/Job';

export const addJob = async (): Promise<IJob> => {
  await dbConnect();
  const job = new Job();
  await job.save();
  return job;
};

export const getJob = async (id: string): Promise<IJob | null> => {
  await dbConnect();
  return Job.findById(id);
};

export const updateJobStatus = async (
  id: string,
  status: IJob['status']
): Promise<IJob | null> => {
  await dbConnect();
  return Job.findByIdAndUpdate(id, { status }, { new: true });
};

export const completeJob = async (
  id: string,
  result: any
): Promise<IJob | null> => {
  await dbConnect();
  return Job.findByIdAndUpdate(
    id,
    { status: 'completed', result },
    { new: true }
  );
};

export const failJob = async (id: string, error: string): Promise<IJob | null> => {
  await dbConnect();
  return Job.findByIdAndUpdate(
    id,
    { status: 'failed', error },
    { new: true }
  );
};
