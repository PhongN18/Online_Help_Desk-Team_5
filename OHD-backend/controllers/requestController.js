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
            remarks,
            created_at: Date.now(),
            updated_at: Date.now()
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
        const { status, facility, severity, page, limit, created_by_me, assigned_to, need_handle } = req.query; // Added assigned_to

        let filter = {}; // Default: Admins see all requests

        if (status) filter.status = status;
        if (facility) filter.facility = facility;
        if (severity) filter.severity = severity

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

        if (page && limit) {
            const parsedLimit = parseInt(limit, 10);
            const parsedPage = parseInt(page, 10);

            if (parsedPage < 1 || parsedLimit < 1) {
                return res.status(400).json({ message: 'Page and limit must be greater than 0' });
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
        } else {
            const requests = await Request.find(filter).exec()

            res.json({ requests })
        }

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

// For admin dashboard
// 📌 1️⃣ Overview Statistics
exports.getOverviewStats = async (req, res) => {
    try {
        const totalRequests = await Request.countDocuments();
        const statusCounts = await Request.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        const pendingClosingRequests = await Request.countDocuments({ closing_reason: { $ne: null }, manager_handle: null });

        const stats = {
            totalRequests,
            pendingClosingRequests,
            statusCounts: statusCounts.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {})
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 📌 2️⃣ Requests Over Time (Last 30 Days)
exports.getRequestsOverTime = async (req, res) => {
    try {
        const today = new Date();
        const firstDayOfFirstMonth = new Date(today.getFullYear(), today.getMonth() - 5, 1); // First day of 6 months ago

        const requestTrends = await Request.aggregate([
            {
                $match: { created_at: { $gte: firstDayOfFirstMonth } } // Ensure we count from the 1st day of 6 months ago
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%m/%Y", date: "$created_at" } // Format as "MM YYYY"
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } } // Ensure chronological sorting
        ]);
        

        // console.log(requestTrends);

        const months = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            months.push(date.toLocaleString('en-US', { month: '2-digit', year: 'numeric' }).replace(',', ''));
        }

        // Convert aggregation result into a Map
        const requestTrendsMap = new Map(requestTrends.map(item => [item._id, item.count]));

        // Fill missing months with count 0
        const formattedTrends = months.map(month => ({
            _id: month,
            count: requestTrendsMap.get(month) || 0
        }));

        res.json(formattedTrends);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// 📌 3️⃣ Requests by Facility
exports.getRequestsByFacility = async (req, res) => {
    try {
        const facilityCounts = await Request.aggregate([
            { $group: { _id: "$facility", count: { $sum: 1 } } },
            { $lookup: { from: "facilities", localField: '_id', foreignField: 'facility_id', as: 'facilityDetails' } },
            { $unwind: '$facilityDetails' },
            { $sort: { count: -1 } }
        ]);

        res.json(facilityCounts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 📌 4️⃣ Severity Distribution
exports.getSeverityDistribution = async (req, res) => {
    try {
        const severityCounts = await Request.aggregate([
            { $group: { _id: "$severity", count: { $sum: 1 } } }
        ]);

        res.json(severityCounts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 📌 5️⃣ Average Request Resolution Time
exports.getResolutionTime = async (req, res) => {
    try {
        const closedRequests = await Request.aggregate([
            { $match: { status: "Closed" } },
            {
                $project: {
                    resolutionTime: { $subtract: ["$updated_at", "$created_at"] }
                }
            },
            {
                $group: {
                    _id: null,
                    avgResolutionTime: { $avg: "$resolutionTime" }
                }
            }
        ]);

        res.json({ avgResolutionTime: closedRequests[0]?.avgResolutionTime || 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// exports.getRequestsBySeverityPerFacility = async (req, res) => {
//     try {
//         // Aggregating the requests by facility and severity
//         const requestData = await Request.aggregate([
//             // Step 1: Match the data, you can also add filtering if needed
//             {
//                 $group: {
//                     _id: {
//                         facility: "$facility",
//                         severity: "$severity"
//                     },
//                     count: { $sum: 1 }
//                 }
//             },
//             // Step 2: Join with the Facility collection to get the facility name
//             {
//                 $lookup: {
//                     from: "facilities", // The name of your facilities collection in MongoDB
//                     localField: "_id.facility",
//                     foreignField: "facility_id",
//                     as: "facilityData"
//                 }
//             },
//             {
//                 $unwind: "$facilityData"
//             },
//             // Step 3: Format the data so it's more readable
//             {
//                 $project: {
//                     facility_name: "$facilityData.name",
//                     severity: "$_id.severity",
//                     count: 1
//                 }
//             }
//         ]);

//         // If no data found
//         if (!requestData.length) {
//             return res.status(404).json({ message: "No data found" });
//         }

//         // Return the aggregated data
//         res.json(requestData);
//     } catch (err) {
//         // Handle errors
//         console.error(err);
//         res.status(500).json({ error: err.message });
//     }
// };
