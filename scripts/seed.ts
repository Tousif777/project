import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dbConnect from '../lib/db';
import User from '../models/User';

async function seed() {
  console.log('Connecting to database...');
  await dbConnect();
  console.log('Connected to database.');

  try {
    const existingAdmin = await User.findOne({ role: 'super-admin' });

    if (existingAdmin) {
      console.log('Super admin already exists. No action taken.');
      return;
    }

    console.log('Creating super admin...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const adminUser = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'super-admin',
      permissions: {
        canRunCalculations: true,
        canViewReports: true,
        canManageSettings: true,
        canExportData: true,
        canManageSubAdmins: true,
      },
    });

    await adminUser.save();
    console.log('Super admin created successfully!');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    console.log('Disconnecting from database...');
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

seed();
