const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware to protect routes (ensure user is authenticated)
exports.protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user info to request object
            req.user = decoded;

            next(); // Proceed to the next middleware
        } catch (err) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Middleware to check if the user has a specific role
exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.roles[0])) {
            return res.status(403).json({ message: 'Forbidden: You do not have access to this resource' });
        }
        next(); // Proceed if role is authorized
    };
};
