const mongoose = require('mongoose');

const FacilitySchema = new mongoose.Schema({
    facility_id: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    head_manager: { type: String, required: true },
    employees: [{ type: String }],
    status: {
        type: String,
        enum: ['Operating', 'Under Maintenance', 'Temporarily Closed', 'Pending', 'Closed', 'In Use'], // Explicit list of options
        default: 'Operating', // Default status when not set
        required: true // Ensure a status is always set
    },
    location: { type: String },
    status_history: [{
        status: String,
        updated_at: { type: Date, default: Date.now },
        updated_by: { type: String } // User ID of the person who updated the status
    }]
}, {
    timestamps: true // Automatically add `created_at` and `updated_at`
});

// Indexing for efficient searching
FacilitySchema.index({ status: 1 });

module.exports = mongoose.model('Facility', FacilitySchema);
