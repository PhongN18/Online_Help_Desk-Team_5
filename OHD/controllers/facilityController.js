const Facility = require('../models/Facility');

// Tạo mới một facility
exports.createFacility = async (req, res) => {
    try {
        const facility = new Facility(req.body);
        await facility.save();
        res.status(201).json(facility);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Lấy danh sách các facility
exports.getFacilities = async (req, res) => {
    try {
        const facilities = await Facility.find();
        res.json(facilities);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Lấy 1 facility theo facility_id
exports.getFacility = async (req, res) => {
    try {
        const facility = await Facility.findOne({ facility_id: req.params.facility_id });
        if(!facility) return res.status(404).json({ message: 'Facility not found' });
        res.json(facility);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Cập nhật thông tin facility
exports.updateFacility = async (req, res) => {
    try {
        const facility = await Facility.findOneAndUpdate({ facility_id: req.params.facility_id }, req.body, { new: true });
        if(!facility) return res.status(404).json({ message: 'Facility not found' });
        res.json(facility);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Xóa facility
exports.deleteFacility = async (req, res) => {
    try {
        const facility = await Facility.findOneAndDelete({ facility_id: req.params.facility_id });
        if(!facility) return res.status(404).json({ message: 'Facility not found' });
        res.json({ message: 'Facility deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
