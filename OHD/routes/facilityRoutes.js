const express = require('express');
const router = express.Router();
const facilityController = require('../controllers/facilityController');
const { check } = require('express-validator');

router.post(
    '/',
    [
        check('name').notEmpty().withMessage('Facility name is required'),
        check('head_manager').notEmpty().withMessage('Head manager is required')
    ],
    facilityController.createFacility
);
router.get(
    '/',
    [
        check('status').optional().isIn(['Operating', 'Under Maintenance']).withMessage('Invalid status value')
    ],
    facilityController.getFacilities  // Pagination handled in controller
);
router.get('/:facility_id', facilityController.getFacility);
router.put('/:facility_id', facilityController.updateFacility);
router.delete('/:facility_id', facilityController.deleteFacility);

module.exports = router;
