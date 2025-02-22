const Request = require('../models/Request');
const Facility = require('../models/Facility');
const { validationResult } = require('express-validator');  // For request validation

// Create a new request
exports.createRequest = async (req, res) => {
    const errors = validationResult(req);  // Collect validation errors
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });  // Return errors if validation fails
    }

    try {
        const { created_by, facility, title, severity, description, status, remarks } = req.body;

        // Generate request_id
        const request_id = `Req${Date.now()}`;

        // Create the new request
        const request = new Request({
            request_id,
            created_by,
            facility,
            title,
            severity,
            description,
            status: status || 'unassigned',  // Default status is 'unassigned'
            remarks
        });

        await request.save();
        res.status(201).json(request);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get all requests with optional filters and pagination
exports.getRequests = async (req, res) => {
    try {
        const { status, facility, page = 1, limit = 10, created_by_me, assigned_requests } = req.query; // Get filters & pagination

        // Parse `limit` and `page` to integers
        const parsedLimit = parseInt(limit, 10);
        const parsedPage = parseInt(page, 10);

        if (parsedPage < 1 || parsedLimit < 1) {
            return res.status(400).json({ message: 'Page and limit must be greater than 0' });
        }

        let filter = {}; // Default: Admins see all requests

        if (status) filter.status = status;
        if (facility) filter.facility = facility;

        if (req.user.roles.includes('Admin')) {
            // Admins see all requests (no filtering needed)
        }
        if (req.user.roles.includes('Manager')) {
            // Check if `?created_by_me=true` is passed
            if (created_by_me === 'true') {
                // If `created_by_me=true`, show only requests created by this Manager
                filter.created_by = req.user.user_id;
            } else {
                // Find the facility where the manager is the head
                const managedFacility = await Facility.findOne({ head_manager: req.user.user_id });

                if (managedFacility) {
                    filter.facility = managedFacility.facility_id;
                } else {
                    return res.status(403).json({ message: "You are not responsible for any facility." });
                }
            }
        }
        else {
            // Requesters & Technicians only see their own requests
            filter.$or = [
                { created_by: req.user.user_id },
                { assigned_to: req.user.user_id }
            ];
        }

        // Get total number of requests (for pagination metadata)
        const totalItems = await Request.countDocuments(filter);

        // Get the paginated requests
        const requests = await Request.find(filter)
            .skip((parsedPage - 1) * parsedLimit)  // Skip items based on page number
            .limit(parsedLimit)  // Limit the number of items per page
            .exec();

        // Calculate total pages
        const totalPages = Math.ceil(totalItems / parsedLimit);

        // Send the response
        res.json({
            totalItems,
            totalPages,
            currentPage: parsedPage,
            data: requests
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get a single request by request_id
exports.getRequest = async (req, res) => {
    try {
        const request = await Request.findOne({ request_id: req.params.request_id });
        if (!request) return res.status(404).json({ message: 'Request not found' });
        res.json(request);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update request details
exports.updateRequest = async (req, res) => {
    const errors = validationResult(req);  // Collect validation errors
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });  // Return errors if validation fails
    }

    try {
        req.body.updated_at = Date.now();  // Automatically set the updated_at field

        const request = await Request.findOneAndUpdate({ request_id: req.params.request_id }, req.body, { new: true });
        if (!request) return res.status(404).json({ message: 'Request not found' });

        res.json(request);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete a request
exports.deleteRequest = async (req, res) => {
    try {
        const request = await Request.findOneAndDelete({ request_id: req.params.request_id });
        if (!request) return res.status(404).json({ message: 'Request not found' });
        res.json({ message: 'Request deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
