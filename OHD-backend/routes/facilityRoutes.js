const express = require('express');
const router = express.Router();
const facilityController = require('../controllers/facilityController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { check } = require('express-validator');

// 🔒 Create a new facility (Only Admins)
router.post(
    '/',
    protect, authorizeRoles('Admin'),
    [
        check('name').notEmpty().withMessage('Facility name is required'),
    ],
    facilityController.createFacility
);

// 🔓 Get all facilities (Accessible by all authenticated users)
router.get(
    '/',
    protect,
    [
        check('status')
            .optional()
            .isIn(['Operating', 'Under Maintenance', 'Temporarily Closed', 'Pending', 'Closed', 'In Use'])
            .withMessage('Invalid status value')
    ],
    facilityController.getFacilities
);

// 🔓 Get a specific facility by facility_id (Accessible by all authenticated users)
router.get('/:facility_id', protect, facilityController.getFacility);

// 🔒 Update facility details (Only Admins)
router.put('/:facility_id', protect, authorizeRoles('Admin'), facilityController.updateFacility);

// 🔒 Delete a facility (Only Admins)
router.delete('/:facility_id', protect, authorizeRoles('Admin'), facilityController.deleteFacility);

module.exports = router;
