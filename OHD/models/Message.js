const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    message_id: { type: String, unique: true, required: true },
    message_type: { type: String, enum: ['created', 'status-change'], required: true },
    sender_id: { type: String, required: true },
    recipient_ids: [{ type: String, required: true }],
    message: { type: String, required: true },
    request_id: { type: String },
    timestamp: { type: Date, default: Date.now }
});

// Indexing for faster queries (e.g., find messages by sender or recipient)
MessageSchema.index({ sender_id: 1 });
MessageSchema.index({ recipient_ids: 1 });
MessageSchema.index({ request_id: 1 });

module.exports = mongoose.model('Message', MessageSchema);
