const express = require('express');
const router = express.Router();
const { registerUser, loginUser, refreshToken, getCurrentUser, logoutUser } = require('../controllers/authController');
const { check } = require('express-validator');
const { protect } = require("../middleware/authMiddleware");

router.post(
    '/register',
    [
        check('name').notEmpty().withMessage('Name is required'),
        check('email').isEmail().withMessage('Please provide a valid email'),
        check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ],
    registerUser
);

router.post(
    '/login',
    [
        check('email').isEmail().withMessage('Please provide a valid email'),
        check('password').notEmpty().withMessage('Password is required')
    ],
    loginUser
);

router.post('/refresh', refreshToken);
router.get('/me', protect, getCurrentUser);

router.post('/logout', logoutUser);

module.exports = router;
