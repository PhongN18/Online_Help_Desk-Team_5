const { validationResult } = require('express-validator');
const User = require('../models/User');
const Request = require('../models/Request');
const Facility = require('../models/Facility');
const bcrypt = require('bcryptjs');
const { getMaxUserId, updateMaxUserId } = require('../utils/initMaxIds');

// Create a new user
exports.createUser = async (req, res) => {
    const errors = validationResult(req);  // Collect validation errors

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });  // Return errors if validation fails
    }

    try {
        const { email, password, name, roles } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        // Generate the next user_id
        let currentMaxId = await getMaxUserId()
        const user_id = `U${(currentMaxId + 1).toString().padStart(6, '0')}`;

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save the user
        const user = new User({
            user_id,
            email,
            password: hashedPassword,
            name,
            roles: roles || ['Requester'],
        });

        await user.save();
        await updateMaxUserId();  // Update the max user_id
        res.status(201).json(user);  // Return the created user
    } catch (err) {
        res.status(400).json({ error: err.message });  // Return error if any
    }
};

// Get all users with optional filters and pagination
exports.getUsers = async (req, res) => {
    try {
        const { roles, status, facility, page, limit } = req.query;  // Get filters and pagination info from query params

        // Build filter object based on query parameters
        let filter = {};
        if (roles) {
            const rolesArray = roles.split(","); // Convert string to an array
            filter["roles.0"] = { $in: rolesArray }; // Match any role from the array
        }
        if (status) filter.status = status;  // Filter by status if provided

        if (facility) {
            const facilityDetails = await Facility.findOne({ facility_id: facility })
            if (!facilityDetails) return res.status(404).json({ message: 'Facility not found' })
            let facilityEmployees = [...facilityDetails.technicians]
            const headManager = facilityDetails.head_manager;

            if (headManager && !facilityEmployees.includes(headManager)) {
                facilityEmployees.push(headManager);
            }

            filter.user_id = { $in: facilityEmployees }
        }

        // Get total number of users (for pagination metadata)
        const totalItems = await User.countDocuments(filter);

        if (page && limit) {
            // Parse `limit` and `page` to integers
            const parsedLimit = parseInt(limit, 10);
            const parsedPage = parseInt(page, 10);

            // Ensure page and limit are valid numbers
            if (parsedPage < 1 || parsedLimit < 1) {
                return res.status(400).json({ message: 'Page and limit must be greater than 0' });
            }

            // Get the paginated users
            const users = await User.find(filter)
                .skip((parsedPage - 1) * parsedLimit)  // Skip items based on page number
                .limit(parsedLimit)  // Limit the number of items per page
                .exec();

            // Calculate total pages based on the total number of items and limit
            const totalPages = Math.ceil(totalItems / parsedLimit);

            // Send the paginated response
            res.json({
                totalItems,
                totalPages,
                currentPage: parsedPage,
                data: users  // Array of users
            });
        } else {
            const users = await User.find(filter).exec()

            res.json({ data: users })
        }

        

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Get a user by user_id
exports.getUser = async (req, res) => {
    try {
        const user = await User.findOne({ user_id: req.params.user_id });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Fetch multiple users by their IDs (comma-separated)
exports.getUsersByIds = async (req, res) => {
    try {
        const { ids } = req.query; // Get `ids` parameter from the request

        if (!ids) {
            return res.status(400).json({ message: "No user IDs provided" });
        }

        const userIdsArray = ids.split(","); // Convert comma-separated string to an array
        const users = await User.find({ user_id: { $in: userIdsArray } });

        res.json({ totalUsers: users.length, data: users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Get requests created by a user
exports.getCreatedRequests = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;  // Default values for page and limit

        const parsedLimit = parseInt(limit, 10);
        const parsedPage = parseInt(page, 10);

        // Ensure valid values for pagination
        if (parsedPage < 1 || parsedLimit < 1) {
            return res.status(400).json({ message: 'Page and limit must be greater than 0' });
        }

        // Calculate the total number of requests created by the user
        const totalItems = await Request.countDocuments({ created_by: req.params.user_id });

        // Get paginated results
        const requests = await Request.find({ created_by: req.params.user_id })
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
            data: requests  // Array of requests
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get requests assigned to a user with pagination
exports.getAssignedRequests = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;  // Default values for page and limit

        const parsedLimit = parseInt(limit, 10);
        const parsedPage = parseInt(page, 10);

        // Ensure valid values for pagination
        if (parsedPage < 1 || parsedLimit < 1) {
            return res.status(400).json({ message: 'Page and limit must be greater than 0' });
        }

        // Calculate the total number of requests assigned to the user
        const totalItems = await Request.countDocuments({ assigned_to: req.params.user_id });

        // Get paginated results
        const requests = await Request.find({ assigned_to: req.params.user_id })
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
            data: requests  // Array of requests
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



// Update user information
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findOne({ user_id: req.params.user_id });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (req.body.password) {
            req.body.password = await bcrypt.hash(req.body.password, 10); // Hash password if updated
        }

        const updatedUser = await User.findOneAndUpdate({ user_id: req.params.user_id }, req.body, { new: true });
        res.json(updatedUser);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete a user
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findOneAndDelete({ user_id: req.params.user_id });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted successfully' });

        if (user.user_id === `U${maxCurrentUserId.toString().padStart(6, '0')}`) {
            await updateMaxUserId();  // Update global maxCurrentUserId after deletion
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
