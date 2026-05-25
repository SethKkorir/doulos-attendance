import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  campus: { type: String, default: 'Athi River' }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Airtight protection: Prevent deletion of SuperAdmin accounts at the database level
userSchema.pre('deleteOne', async function (next) {
  const query = this.getQuery();
  const user = await this.model.findOne(query);
  if (user && (user.role === 'superadmin' || user.username.toLowerCase() === 'superadmin' || user.username.toLowerCase() === 'supersuperadmin')) {
    return next(new Error('Access Denied: The SuperAdmin account is protected and cannot be deleted.'));
  }
  next();
});

userSchema.pre('findOneAndDelete', async function (next) {
  const query = this.getQuery();
  const user = await this.model.findOne(query);
  if (user && (user.role === 'superadmin' || user.username.toLowerCase() === 'superadmin' || user.username.toLowerCase() === 'supersuperadmin')) {
    return next(new Error('Access Denied: The SuperAdmin account is protected and cannot be deleted.'));
  }
  next();
});

userSchema.pre('deleteMany', async function (next) {
  const query = this.getQuery();
  const users = await this.model.find(query);
  const hasSuperAdmin = users.some(user => 
    user.role === 'superadmin' || 
    user.username.toLowerCase() === 'superadmin' || 
    user.username.toLowerCase() === 'supersuperadmin'
  );
  if (hasSuperAdmin) {
    return next(new Error('Access Denied: One or more SuperAdmin accounts are protected and cannot be deleted.'));
  }
  next();
});

export default mongoose.model('User', userSchema);
