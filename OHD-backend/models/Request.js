const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
    request_id: { type: String, unique: true, required: true },  // Request ID as String
    created_by: { type: String, required: true },  // user_id (String)
    assigned_to: { type: String },  // user_id (String)
    assigned_by: { type: String },  // user_id (String)
    facility: { type: String, required: true },
    title: { type: String, required: true },
    severity: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    description: { type: String, required: true },
    closing_reason: { type: String },
    manager_handle: { type: String },
    status: {
        type: String,
        enum: ['Unassigned', 'Assigned', 'Work in progress', 'Closed', 'Rejected'],
        default: 'Unassigned'
    },
    remarks: { type: String },
    created_at: { type: Date },
    updated_at: { type: Date },
});

// Indexing for faster queries
RequestSchema.index({ status: 1 });
RequestSchema.index({ created_by: 1 });
RequestSchema.index({ facility: 1 });

module.exports = mongoose.model('Request', RequestSchema);
