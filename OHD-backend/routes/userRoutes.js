const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { check } = require('express-validator');

// 🔒 Register a new user (open route, so no authentication needed)
router.post('/',
    [
        check('email').isEmail().withMessage('Please provide a valid email'),
        check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        check('name').notEmpty().withMessage('Name is required')
    ],
    userController.createUser
);

// 🔒 Get all users (only accessible by Admins)
router.get('/', protect, authorizeRoles('Admin'), userController.getUsers);

// 🔒 Get a single user (users can only access their own data, Admins can access any)
router.get('/:user_id', protect, (req, res, next) => {
    if (req.user.roles.includes('Admin') || req.user.user_id === req.params.user_id) {
        return userController.getUser(req, res);
    } else {
        return res.status(403).json({ message: 'Forbidden: You can only view your own profile' });
    }
});

// 🔒 Update user (users can only update their own profile, Admins can update anyone)
router.put('/:user_id',
    protect,
    [
        check('email').isEmail().withMessage('Please provide a valid email'),
        check('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ],
    (req, res, next) => {
        if (req.user.roles.includes('Admin') || req.user.user_id === req.params.user_id) {
            return userController.updateUser(req, res);
        } else {
            return res.status(403).json({ message: 'Forbidden: You can only update your own profile' });
        }
    }
);

// 🔒 Delete user (only Admins can delete users)
router.delete('/:user_id', protect, authorizeRoles('Admin'), userController.deleteUser);

// 🔒 Get requests created by a user (Users can only see their own, Admins can see any)
router.get('/:user_id/created-requests', protect, (req, res, next) => {
    if (req.user.roles.includes('Admin') || req.user.user_id === req.params.user_id) {
        return userController.getCreatedRequests(req, res);
    } else {
        return res.status(403).json({ message: 'Forbidden: You can only view your own requests' });
    }
});

// 🔒 Get requests assigned to a user (Users can only see their own, Admins can see any)
router.get('/:user_id/assigned-requests', protect, (req, res, next) => {
    if (req.user.roles.includes('Admin') || req.user.user_id === req.params.user_id) {
        return userController.getAssignedRequests(req, res);
    } else {
        return res.status(403).json({ message: 'Forbidden: You can only view your own assigned requests' });
    }
});

module.exports = router;
