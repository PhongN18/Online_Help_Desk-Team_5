const express = require('express');
const router = express.Router();
const facilityController = require('../controllers/facilityController');

router.post('/', facilityController.createFacility);
router.get('/', facilityController.getFacilities);
router.get('/:facility_id', facilityController.getFacility);
router.put('/:facility_id', facilityController.updateFacility);
router.delete('/:facility_id', facilityController.deleteFacility);

module.exports = router;
