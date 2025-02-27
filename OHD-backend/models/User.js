const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    user_id: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    roles: [{
        type: String,
        enum: ['Requester', 'Manager', 'Technician', 'Admin'],
        default: ['Requester']  // Default role is 'Requester'
    }],
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    refreshToken: { type: String }, // Store refresh token for session management
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
});

UserSchema.pre('save', async function (next) {
    // Role Management: Ensure "Manager" also has "Technician" role
    if (this.roles.includes('Manager') && !this.roles.includes('Technician')) {
        this.roles.push('Technician');
    }

    // Ensure that Admin has only "Admin" role
    if (this.roles.includes('Admin')) {
        this.roles = ['Admin'];  // Override other roles
    }

    // Hash password only if it's modified or new
    if (!this.isModified('password')) return next(); // Skip if password is unchanged

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt); // Hash password
        next();
    } catch (err) {
        next(err);
    }
});

// Compare entered password with stored hashed password
UserSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);