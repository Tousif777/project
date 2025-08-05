import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dbConnect from "../lib/db";
import User from "../models/User";

async function seed() {
  console.log("Connecting to database...");
  await dbConnect();
  console.log("Connected to database.");

  try {
    // Check if users already exist
    const existingAdmin = await User.findOne({ role: "super-admin" });
    const existingUser = await User.findOne({ username: "testuser" });

    // Create super admin if doesn't exist
    if (!existingAdmin) {
      console.log("Creating super admin...");
      const hashedAdminPassword = await bcrypt.hash("admin123", 10);

      const adminUser = new User({
        username: "admin",
        email: "admin@example.com",
        password: hashedAdminPassword,
        role: "super-admin",
        permissions: {
          canRunCalculations: true,
          canViewReports: true,
          canManageSettings: true,
          canExportData: true,
          canManageSubAdmins: true,
        },
        firstName: "Admin",
        lastName: "User",
        company: "FBA Shipment Co.",
      });

      await adminUser.save();
      console.log("Super admin created successfully!");
      console.log("  Username: admin");
      console.log("  Password: admin123");
    } else {
      console.log("Super admin already exists.");
    }

    // Create test user if doesn't exist
    if (!existingUser) {
      console.log("Creating test user...");
      const hashedUserPassword = await bcrypt.hash("test123", 10);

      const testUser = new User({
        username: "testuser",
        email: "test@example.com",
        password: hashedUserPassword,
        role: "sub-admin",
        permissions: {
          canRunCalculations: true,
          canViewReports: true,
          canManageSettings: true,
          canExportData: true,
          canManageSubAdmins: false,
        },
        firstName: "Test",
        lastName: "User",
        company: "Test Company",
      });

      await testUser.save();
      console.log("Test user created successfully!");
      console.log("  Username: testuser");
      console.log("  Password: test123");
    } else {
      console.log("Test user already exists.");
    }

    console.log("\n=== LOGIN CREDENTIALS ===");
    console.log("Admin User:");
    console.log("  Username: admin");
    console.log("  Password: admin123");
    console.log("\nTest User:");
    console.log("  Username: testuser");
    console.log("  Password: test123");
    console.log("========================\n");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    console.log("Disconnecting from database...");
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

seed();
