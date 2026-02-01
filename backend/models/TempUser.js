const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const TempUserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['jobseeker'], default: 'jobseeker', required: true },
    otp: { type: String },
    createdAt: { type: Date, default: Date.now, expires: '10m' } // Document will be automatically deleted after 10 minutes
});

// Encrypt password before saving
TempUserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('TempUser', TempUserSchema);