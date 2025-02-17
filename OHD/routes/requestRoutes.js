const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');

router.post('/', requestController.createRequest);
router.get('/', requestController.getRequests);
router.get('/:request_id', requestController.getRequest);
router.put('/:request_id', requestController.updateRequest);
router.delete('/:request_id', requestController.deleteRequest);

module.exports = router;
