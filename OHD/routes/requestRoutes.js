const express = require('express');
const { check } = require('express-validator');  // For validation
const router = express.Router();
const requestController = require('../controllers/requestController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// 🔒 Create a new request (Only Requesters can create requests)
router.post(
    '/',
    protect, authorizeRoles('Requester'),
    [
        check('facility').notEmpty().withMessage('Facility is required'),
        check('severity').isIn(['low', 'medium', 'high']).withMessage('Severity must be one of: low, medium, high'),
        check('description').notEmpty().withMessage('Description is required')
    ],
    requestController.createRequest
);

// 🔒 Get all requests (Admins see all, Managers only see their facility's requests)
router.get('/', protect, requestController.getRequests);

// 🔒 Get a specific request (Users can only access their own, Admins can see any)
router.get('/:request_id', protect, requestController.getRequest);

// 🔒 Update a request (Only Managers & Technicians can update request status)
router.put(
    '/:request_id',
    protect, authorizeRoles('Manager', 'Technician'),
    [
        check('status').optional().isIn(['Unassigned', 'Assigned', 'Work in progress', 'Closed', 'Rejected']).withMessage('Invalid status value'),
        check('remarks').optional().notEmpty().withMessage('Remarks cannot be empty if provided')
    ],
    requestController.updateRequest
);

// 🔒 Delete a request (Only Managers can delete requests)
router.delete('/:request_id', protect, authorizeRoles('Manager', 'Admin'), requestController.deleteRequest);

module.exports = router;
