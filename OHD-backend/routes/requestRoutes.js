const express = require('express');
const { check } = require('express-validator');  // For validation
const router = express.Router();
const requestController = require('../controllers/requestController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// 🔒 Create a new request (Only Requesters can create requests)
router.post(
    '/',
    protect, authorizeRoles('Requester', 'Technician', 'Manager'),
    [
        check('facility').notEmpty().withMessage('Facility is required'),
        check('severity').isIn(['Low', 'Medium', 'High']).withMessage('Severity must be one of: Low, Medium, High'),
        check('description').notEmpty().withMessage('Description is required')
    ],
    requestController.createRequest
);

// 🔒 Get all requests (Admins see all, Managers only see their facility's requests)
router.get('/', protect, requestController.getRequests);

// 🔒 Get a specific request (Users can only access their own, Admins can see any)
router.get('/:request_id', protect, requestController.getRequest);

// 🔒 Update a request
router.put(
    '/:request_id',
    protect,
    [
        check('status').optional().isIn(['Unassigned', 'Assigned', 'Work in progress', 'Closed', 'Rejected']).withMessage('Invalid status value'),
        check('remarks').optional().notEmpty().withMessage('Remarks cannot be empty if provided')
    ],
    requestController.updateRequest
);

// 🔒 Delete a request (Only Managers can delete requests)
router.delete('/:request_id', protect, authorizeRoles('Manager', 'Admin'), requestController.deleteRequest);

// For admin dashboard
router.get("/admin/overview-stats", protect, authorizeRoles('Admin'), requestController.getOverviewStats);  // Overview statistics
router.get("/admin/requests-over-time", protect, authorizeRoles('Admin'), requestController.getRequestsOverTime);  // Requests trend
router.get("/admin/requests-by-facility", protect, authorizeRoles('Admin'), requestController.getRequestsByFacility);  // Requests by facility
router.get("/admin/severity-distribution", protect, authorizeRoles('Admin'), requestController.getSeverityDistribution);  // Severity distribution
router.get("/admin/average-resolution-time", protect, authorizeRoles('Admin'), requestController.getResolutionTime);  // Average resolution time
// router.get('/admin/requests-by-severity-per-facility', protect, authorizeRoles('Admin'), requestController.getRequestsBySeverityPerFacility);

module.exports = router;
