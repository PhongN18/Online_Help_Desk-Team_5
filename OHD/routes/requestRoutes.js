const express = require('express');
const { check } = require('express-validator');  // For validation
const router = express.Router();
const requestController = require('../controllers/requestController');

// Route to create a new request with validation
router.post(
    '/',
    [
        check('request_id').notEmpty().withMessage('Request ID is required'),
        check('created_by').notEmpty().withMessage('User ID of the creator is required'),
        check('facility').notEmpty().withMessage('Facility is required'),
        check('severity').isIn(['low', 'medium', 'high']).withMessage('Severity must be one of: low, medium, high'),
        check('description').notEmpty().withMessage('Description is required')
    ],
    requestController.createRequest
);

// Route to get all requests with optional filters and pagination
router.get(
    '/',
    [
        check('status').optional().isIn(['Unassigned', 'Assigned', 'Work in progress', 'Closed', 'Rejected']).withMessage('Invalid status value'),
        check('facility').optional().notEmpty().withMessage('Facility should not be empty')
    ],
    requestController.getRequests
);

// Route to get a specific request by request_id
router.get('/:request_id', requestController.getRequest);

// Route to update a request by request_id with validation
router.put(
    '/:request_id',
    [
        check('status').optional().isIn(['Unassigned', 'Assigned', 'Work in progress', 'Closed', 'Rejected']).withMessage('Invalid status value'),
        check('remarks').optional().notEmpty().withMessage('Remarks cannot be empty if provided')
    ],
    requestController.updateRequest
);

// Route to delete a request by request_id
router.delete('/:request_id', requestController.deleteRequest);

module.exports = router;
