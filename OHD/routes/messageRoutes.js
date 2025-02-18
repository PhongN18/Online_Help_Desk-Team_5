const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const messageController = require('../controllers/messageController');

// Route to create a new message with validation
router.post(
    '/',
    [
        check('message_id').notEmpty().withMessage('Message ID is required'),
        check('message_type').isIn(['created', 'status-change']).withMessage('Invalid message type'),
        check('sender_id').notEmpty().withMessage('Sender ID is required'),
        check('recipient_ids').isArray().withMessage('Recipient IDs should be an array')
    ],
    messageController.createMessage
);

// Route to get all messages with optional filters and pagination
router.get(
    '/',
    messageController.getMessages  // Pagination and filtering are handled in the controller
);

// Route to get a specific message by message_id
router.get('/:message_id', messageController.getMessage);

// Route to update a message by message_id
router.put(
    '/:message_id',
    [
        check('message_type').optional().isIn(['created', 'status-change']),
        check('message').optional().notEmpty().withMessage('Message content cannot be empty')
    ],
    messageController.updateMessage
);

// Route to delete a message by message_id
router.delete('/:message_id', messageController.deleteMessage);

module.exports = router;
