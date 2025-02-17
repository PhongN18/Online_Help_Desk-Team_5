const Message = require('../models/Message');

// Tạo mới một message
exports.createMessage = async (req, res) => {
    try {
        const message = new Message(req.body);
        await message.save();
        res.status(201).json(message);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Lấy danh sách các message
exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find();
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Lấy 1 message theo message_id
exports.getMessage = async (req, res) => {
    try {
        const message = await Message.findOne({ message_id: req.params.message_id });
        if(!message) return res.status(404).json({ message: 'Message not found' });
        res.json(message);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Cập nhật message
exports.updateMessage = async (req, res) => {
    try {
        const message = await Message.findOneAndUpdate({ message_id: req.params.message_id }, req.body, { new: true });
        if(!message) return res.status(404).json({ message: 'Message not found' });
        res.json(message);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Xóa message
exports.deleteMessage = async (req, res) => {
    try {
        const message = await Message.findOneAndDelete({ message_id: req.params.message_id });
        if(!message) return res.status(404).json({ message: 'Message not found' });
        res.json({ message: 'Message deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
