const Request = require('../models/Request');

// Tạo mới một yêu cầu
exports.createRequest = async (req, res) => {
    try {
        const request = new Request(req.body);
        await request.save();
        res.status(201).json(request);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Lấy danh sách các yêu cầu
exports.getRequests = async (req, res) => {
    try {
        const requests = await Request.find();
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Lấy 1 yêu cầu theo request_id
exports.getRequest = async (req, res) => {
    try {
        const request = await Request.findOne({ request_id: req.params.request_id });
        if(!request) return res.status(404).json({ message: 'Request not found' });
        res.json(request);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Cập nhật thông tin yêu cầu
exports.updateRequest = async (req, res) => {
    try {
        req.body.updated_at = Date.now();
        const request = await Request.findOneAndUpdate({ request_id: req.params.request_id }, req.body, { new: true });
        if(!request) return res.status(404).json({ message: 'Request not found' });
        res.json(request);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Xóa yêu cầu
exports.deleteRequest = async (req, res) => {
    try {
        const request = await Request.findOneAndDelete({ request_id: req.params.request_id });
        if(!request) return res.status(404).json({ message: 'Request not found' });
        res.json({ message: 'Request deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
