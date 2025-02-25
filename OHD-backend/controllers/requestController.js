const Request = require('../models/Request');
const Facility = require('../models/Facility');
const User = require('../models/User');
const { validationResult } = require('express-validator');  // For request validation
const sendEmail = require('../utils/emailService');

// Create a new request
exports.createRequest = async (req, res) => {
    const errors = validationResult(req);  // Collect validation errors
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });  // Return errors if validation fails
    }

    try {
        const { created_by, facility, title, severity, description, status, remarks, user_email } = req.body;

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

        const facilityDetail = await Facility.findOne({ facility_id: facility });
        const managerDetail = await User.findOne({ user_id: facilityDetail.head_manager });

        try {
            await sendEmail(
                user_email,
                "Request created successfully",
                `Created request`,
                `
                <p>Your request has been created successfully and sent to the responsible manager.</p>
                <p><strong>Facility:</strong> ${facilityDetail.name}</p>
                <p><strong>Title:</strong> ${title}</p>
                <p><strong>Severity:</strong> ${severity}</p>
                <p><strong>Description:</strong> ${description}</p>
                <p>Thank you for using Online Help Desk.</p>
                `
            );

            await sendEmail(
                managerDetail.email,
                "New request for your facility",
                `New request`,
                `
                <p>A new request has been created for your facility.</p>
                <p><strong>Facility:</strong> ${facilityDetail.name}</p>
                <p><strong>Title:</strong> ${title}</p>
                <p><strong>Severity:</strong> ${severity}</p>
                <p><strong>Description:</strong> ${description}</p>
                <p>Thank you for using Online Help Desk.</p>
                `
            )
        } catch (emailError) {
            console.error("Email sending failed:", emailError.message);
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get all requests with optional filters and pagination
exports.getRequests = async (req, res) => {
    try {
        const { status, facility, page = 1, limit = 10, created_by_me, assigned_to, need_handle } = req.query; // Added assigned_to

        const parsedLimit = parseInt(limit, 10);
        const parsedPage = parseInt(page, 10);

        if (parsedPage < 1 || parsedLimit < 1) {
            return res.status(400).json({ message: 'Page and limit must be greater than 0' });
        }

        let filter = {}; // Default: Admins see all requests

        if (status) filter.status = status;
        if (facility) filter.facility = facility;

        // Admin sees all requests
        if (req.user.roles.includes('Admin')) {
            // Admins see all requests (no filtering needed)
        }
        // Manager sees requests for their facility and optionally their own created requests
        else if (req.user.roles.includes('Manager')) {
            if (created_by_me === 'true') {
                filter.created_by = req.user.user_id;
            } else if (assigned_to) {
                filter.assigned_to = assigned_to;
            } else {
                const managedFacility = await Facility.findOne({ head_manager: req.user.user_id });
                if (managedFacility) {
                    filter.facility = managedFacility.facility_id;
                    if (need_handle) {
                        filter.closing_reason = { $exists: true }; // Filter requests that need handling
                        filter.manager_handle = { $exists: false }; // Filter requests that need handling
                    }
                } else {
                    return res.status(403).json({ message: "You are not responsible for any facility." });
                }
            }
        }
        else if (req.user.roles.includes('Technician')) {
            if (created_by_me === 'true') {
                filter.created_by = req.user.user_id
            } else if (assigned_to) {
                filter.assigned_to = assigned_to;
            }
        }
        else {
            // Filter by requests created by the user or assigned to them
            filter.$or = [
                { created_by: req.user.user_id }
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

exports.updateRequest = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { request_id } = req.params;
        const { update_action, status, remarks, assigned_by, assigned_to, closing_reason, manager_handle } = req.body;

        const updateBody = {
            ...(assigned_by && { assigned_by }),
            ...(assigned_to && { assigned_to }),
            ...(closing_reason && { closing_reason }),
            ...(manager_handle && { manager_handle }),
            ...(status && { status }),
            ...(remarks && { remarks }),
            updated_at: Date.now(),
        };

        const request = await Request.findOneAndUpdate(
            { request_id },
            updateBody,
            { new: true }
        );

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        // Fetch users in parallel to optimize performance
        const [requestUser, assignedTechnician, facilityManager] = await Promise.all([
            User.findOne({ user_id: request.created_by }),
            assigned_to ? User.findOne({ user_id: request.assigned_to }) : null,
            request.assigned_by ? User.findOne({ user_id: request.assigned_by }) : null
        ]);

        let emailPromises = [];

        // 📌 **Handle Different Actions & Email Notifications**
        switch (update_action) {
            case "assign_technician":
                if (!assigned_to) return;

                if (assignedTechnician) {
                    emailPromises.push(
                        sendEmail(
                            assignedTechnician.email,
                            "New request assigned to you",
                            "Assigned request",
                            `
                            <p>You have been assigned a new request.</p>
                            <p><strong>Facility:</strong> ${request.facility}</p>
                            <p><strong>Title:</strong> ${request.title}</p>
                            <p><strong>Severity:</strong> ${request.severity}</p>
                            <p><strong>Description:</strong> ${request.description}</p>
                            `
                        )
                    );
                }

                if (requestUser) {
                    emailPromises.push(
                        sendEmail(
                            requestUser.email,
                            "Request assigned to technician",
                            "Request assigned",
                            `
                            <p>Your request has been assigned to a technician.</p>
                            <p><strong>Facility:</strong> ${request.facility}</p>
                            <p><strong>Title:</strong> ${request.title}</p>
                            <p><strong>Severity:</strong> ${request.severity}</p>
                            <p><strong>Description:</strong> ${request.description}</p>
                            `
                        )
                    );
                }
                break;

            case "start_work":
                if (requestUser) {
                    emailPromises.push(
                        sendEmail(
                            requestUser.email,
                            "Work Started on Your Request",
                            "Work started",
                            `
                            <p>The technician has started working on your request.</p>
                            <p><strong>Facility:</strong> ${request.facility}</p>
                            <p><strong>Title:</strong> ${request.title}</p>
                            `
                        )
                    );
                }

                if (assignedTechnician) {
                    emailPromises.push(
                        sendEmail(
                            assignedTechnician.email,
                            "Start working on request",
                            "Start working on request",
                            `
                            <p>You have started working on a new request.</p>
                            <p><strong>Facility:</strong> ${request.facility}</p>
                            <p><strong>Title:</strong> ${request.title}</p>
                            `
                        )
                    );
                }
                break;

            case "complete_work":
                if (requestUser) {
                    emailPromises.push(
                        sendEmail(
                            requestUser.email,
                            "Your Request is Completed",
                            "Request completed",
                            `
                            <p>Your request has been marked as completed.</p>
                            <p><strong>Facility:</strong> ${request.facility}</p>
                            <p><strong>Title:</strong> ${request.title}</p>
                            `
                        )
                    );
                }
                break;

            case "submit_closing_reason":
                if (facilityManager) {
                    emailPromises.push(
                        sendEmail(
                            facilityManager.email,
                            "Request Closing Approval Required",
                            "Approval Needed",
                            `
                            <p>A requester has submitted a closing reason for request.</p>
                            <p><strong>Facility:</strong> ${request.facility}</p>
                            <p><strong>Title:</strong> ${request.title}</p>
                            `
                        )
                    );
                }
                break;

            case "manager_approve":
                if (requestUser) {
                    emailPromises.push(
                        sendEmail(
                            requestUser.email,
                            "Your Request Closing Approved",
                            "Request approved",
                            `
                            <p>Your request closing has been approved.</p>
                            <p><strong>Facility:</strong> ${request.facility}</p>
                            <p><strong>Title:</strong> ${request.title}</p>
                            `
                        )
                    );
                }
                break;

            case "manager_decline":
                if (requestUser) {
                    emailPromises.push(
                        sendEmail(
                            requestUser.email,
                            "Your Request Closing Declined",
                            "Request declined",
                            `
                            <p>Your request closing was declined.</p>
                            <p><strong>Facility:</strong> ${request.facility}</p>
                            <p><strong>Title:</strong> ${request.title}</p>
                            `
                        )
                    );
                }
                break;

            case "update_remarks":
                if (assignedTechnician) {
                    emailPromises.push(
                        sendEmail(
                            assignedTechnician.email,
                            "Remarks Updated",
                            "Remarks updated",
                            `
                            <p>Remarks have been updated for the request.</p>
                            <p><strong>Facility:</strong> ${request.facility}</p>
                            <p><strong>Title:</strong> ${request.title}</p>
                            `
                        )
                    );
                }
                break;

            case "manager_reject":
                if (requestUser) {
                    emailPromises.push(
                        sendEmail(
                            requestUser.email,
                            "Your Request is Rejected",
                            "Request rejected",
                            `
                            <p>Your request is rejected by Facility Manager.</p>
                            <p><strong>Facility:</strong> ${request.facility}</p>
                            <p><strong>Title:</strong> ${request.title}</p>
                            `
                        )
                    );
                }
                break;

            default:
                console.log("No email action required.");
        }

        // Execute all email promises concurrently
        await Promise.all(emailPromises);

        res.json(request); // ✅ Now response is sent after emails

    } catch (err) {
        console.error("Error updating request:", err.message);
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
