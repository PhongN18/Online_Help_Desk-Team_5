const Facility = require('../models/Facility');
const { validationResult } = require('express-validator');  // For validation
const { getMaxFacilityId, updateMaxFacilityId } = require('../utils/initMaxIds');

// Create a new facility
exports.createFacility = async (req, res) => {
    const errors = validationResult(req);  // Collect validation errors
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });  // Return errors if validation fails
    }

    try {
        const { name, head_manager, status, location } = req.body;

        // Check if the facility already exists
        const existingFacility = await Facility.findOne({ name });
        if (existingFacility) {
            return res.status(400).json({ error: 'Facility already exists' });
        }

        // Generate the next facility_id
        let currentMaxId = await getMaxFacilityId()
        const facility_id = `U${(currentMaxId + 1).toString().padStart(3, '0')}`;

        // Create the new facility
        const facility = new Facility({
            facility_id,
            name,
            head_manager,
            status: status || 'Operating',  // Default status is 'Operating'
            location
        });

        await facility.save();
        await updateMaxFacilityId();  // Update the max facility_id
        res.status(201).json(facility);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get all facilities
exports.getFacilities = async (req, res) => {
    try {
        const facilities = await Facility.find();

        res.json(facilities);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get a single facility by facility_id
exports.getFacility = async (req, res) => {
    try {
        const facility = await Facility.findOne({ facility_id: req.params.facility_id });
        if (!facility) return res.status(404).json({ message: 'Facility not found' });
        res.json(facility);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update a facility by facility_id
exports.updateFacility = async (req, res) => {
    const errors = validationResult(req);  // Collect validation errors
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });  // Return errors if validation fails
    }

    try {
        const facility = await Facility.findOne({ facility_id: req.params.facility_id });
        if (!facility) return res.status(404).json({ message: 'Facility not found' });

        // Update facility info
        const updatedFacility = await Facility.findOneAndUpdate(
            { facility_id: req.params.facility_id },
            req.body,
            { new: true }
        );
        res.json(updatedFacility);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete a facility by facility_id
exports.deleteFacility = async (req, res) => {
    try {
        const facility = await Facility.findOneAndDelete({ facility_id: req.params.facility_id });
        if (!facility) return res.status(404).json({ message: 'Facility not found' });
        
        const maxCurrentFacilityId = getMaxFacilityId()
        if (facility.facility_id === `F${maxCurrentFacilityId.toString().padStart(3, '0')}`) {
            await updateMaxFacilityId();  // Update global maxCurrentFacilityId after deletion
        }
        res.json({ message: 'Facility deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
