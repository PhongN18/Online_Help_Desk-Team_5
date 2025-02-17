const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

router.post('/', messageController.createMessage);
router.get('/', messageController.getMessages);
router.get('/:message_id', messageController.getMessage);
router.put('/:message_id', messageController.updateMessage);
router.delete('/:message_id', messageController.deleteMessage);

module.exports = router;
