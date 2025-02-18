const Message = require('../models/Message');
const { validationResult } = require('express-validator');  // For validation

// Create a new message
exports.createMessage = async (req, res) => {
    const errors = validationResult(req);  // Collect validation errors
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });  // Return errors if validation fails
    }

    try {
        const { message_type, sender_id, recipient_ids, message, request_id } = req.body;

        // Generate message_id
        const message_id = `Msg${Date.now()}`;

        // Create the new message
        const newMessage = new Message({
            message_id,
            message_type,
            sender_id,
            recipient_ids,
            message,
            request_id
        });

        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get all messages with optional filters and pagination
exports.getMessages = async (req, res) => {
    try {
        const { page = 1, limit = 10, message_type, sender_id, recipient_ids } = req.query;

        const parsedLimit = parseInt(limit, 10);
        const parsedPage = parseInt(page, 10);

        // Ensure valid values for pagination
        if (parsedPage < 1 || parsedLimit < 1) {
            return res.status(400).json({ message: 'Page and limit must be greater than 0' });
        }

        // Build filter object based on query parameters
        let filter = {};
        if (message_type) filter.message_type = message_type;
        if (sender_id) filter.sender_id = sender_id;
        if (recipient_ids) filter.recipient_ids = { $in: recipient_ids.split(',') };  // Handling multiple recipients

        // Calculate total number of messages based on filters
        const totalItems = await Message.countDocuments(filter);

        // Get paginated results
        const messages = await Message.find(filter)
            .skip((parsedPage - 1) * parsedLimit)  // Skip the appropriate number of documents
            .limit(parsedLimit)  // Limit the number of documents returned
            .exec();

        // Calculate total pages
        const totalPages = Math.ceil(totalItems / parsedLimit);

        // Send the paginated response
        res.json({
            totalItems,
            totalPages,
            currentPage: parsedPage,
            data: messages  // Array of messages
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get a single message by message_id
exports.getMessage = async (req, res) => {
    try {
        const message = await Message.findOne({ message_id: req.params.message_id });
        if (!message) return res.status(404).json({ message: 'Message not found' });
        res.json(message);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update a message by message_id
exports.updateMessage = async (req, res) => {
    const errors = validationResult(req);  // Collect validation errors
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });  // Return errors if validation fails
    }

    try {
        const message = await Message.findOneAndUpdate({ message_id: req.params.message_id }, req.body, { new: true });
        if (!message) return res.status(404).json({ message: 'Message not found' });
        res.json(message);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete a message by message_id
exports.deleteMessage = async (req, res) => {
    try {
        const message = await Message.findOneAndDelete({ message_id: req.params.message_id });
        if (!message) return res.status(404).json({ message: 'Message not found' });
        res.json({ message: 'Message deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
