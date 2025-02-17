const mongoose = require('mongoose');

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
    facilities_responsible_for: [{ type: String }],
    assigned_requests: [{ type: String }],
    created_requests: [{ type: String }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
});

// Mongoose middleware to ensure the "Manager" role automatically includes "Technician"
UserSchema.pre('save', function(next) {
    if (this.roles.includes('Manager') && !this.roles.includes('Technician')) {
        this.roles.push('Technician');
    }

    // If the user is an Admin, ensure they only have the 'Admin' role
    if (this.roles.includes('Admin')) {
        this.roles = ['Admin'];  // Admin can only have the 'Admin' role
    }

    next();
});

module.exports = mongoose.model('User', UserSchema);
