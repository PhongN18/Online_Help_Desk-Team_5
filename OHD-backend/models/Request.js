const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
    request_id: { type: String, unique: true, required: true },  // Request ID as String
    created_by: { type: String, required: true },  // user_id (String)
    assigned_to: { type: String },  // user_id (String)
    assigned_by: { type: String },  // user_id (String)
    facility: { type: String, required: true },
    title: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
    description: { type: String, required: true },
    status: {
        type: String,
        enum: ['Unassigned', 'Assigned', 'Work in progress', 'Closed', 'Rejected'],
        default: 'Unassigned'
    },
    remarks: { type: String },
}, {
    timestamps: true  // Automatically add `created_at` and `updated_at`
});

// Indexing for faster queries
RequestSchema.index({ status: 1 });
RequestSchema.index({ created_by: 1 });
RequestSchema.index({ facility: 1 });

module.exports = mongoose.model('Request', RequestSchema);
