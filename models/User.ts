import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username.'],
    unique: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email.'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password.'],
    select: false, // Do not return password by default
  },
  role: {
    type: String,
    enum: ['super-admin', 'sub-admin', 'viewer'],
    default: 'viewer',
  },
  permissions: {
    canRunCalculations: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: true },
    canManageSettings: { type: Boolean, default: false },
    canExportData: { type: Boolean, default: false },
    canManageSubAdmins: { type: Boolean, default: false },
  },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  phone: { type: String, default: '' },
  company: { type: String, default: '' },
  location: { type: String, default: '' },
  timezone: { type: String, default: '' },
  bio: { type: String, default: '' },
  website: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
