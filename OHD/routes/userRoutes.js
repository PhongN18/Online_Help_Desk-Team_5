const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { check } = require('express-validator');

router.post('/',
    [
        check('email').isEmail().withMessage('Please provide a valid email'),
        check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        check('name').notEmpty().withMessage('Name is required')
    ],
    userController.createUser
);
router.get('/', userController.getUsers);
router.get('/:user_id', userController.getUser);
router.put('/:user_id',
    [
        check('email').isEmail().withMessage('Please provide a valid email'),
        check('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ],
    userController.updateUser
);
router.delete('/:user_id', userController.deleteUser);

// Route to get requests created by a user
router.get('/:user_id/created-requests', userController.getCreatedRequests);

// Route to get requests assigned to a user
router.get('/:user_id/assigned-requests', userController.getAssignedRequests);

module.exports = router;
