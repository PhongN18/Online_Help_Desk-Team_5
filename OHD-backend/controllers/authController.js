const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, roles } = req.body;

        // Check if email is already taken
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already registered' });
        }

        // Restrict users from self-registering as Admin
        if (roles && roles.includes('Admin')) {
            return res.status(403).json({ message: 'You cannot register as an Admin' });
        }

        // // Hash password before saving
        // const salt = await bcrypt.genSalt(10);
        // const hashedPassword = await bcrypt.hash(password, salt);

        // Generate unique user_id (assuming auto-increment logic is handled in user creation)
        const lastUser = await User.findOne().sort({ user_id: -1 });
        const newUserId = lastUser ? `U${(parseInt(lastUser.user_id.substring(1)) + 1).toString().padStart(6, '0')}` : 'U000001';

        // Create new user
        const newUser = new User({
            user_id: newUserId,
            name,
            email,
            password,
            roles: roles || ['Requester'], // Default to 'Requester' if no role provided
        });

        await newUser.save();

        // Generate JWT token
        const token = jwt.sign(
            { user_id: newUser.user_id, roles: newUser.roles },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { user_id: newUser.user_id, name: newUser.name, email: newUser.email, roles: newUser.roles }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("📌 Incoming login request:", { email, password });

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            console.log("❌ User not found in database.");
            return res.status(401).json({ message: 'Invalid email or password (User not found)' });
        }

        console.log("✅ User found:", user.email);

        // Compare password using the method from the model
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            console.log("❌ Password mismatch!");
            return res.status(401).json({ message: 'Invalid email or password (Hash Mismatch)' });
        }

        console.log("✅ Password matches!");

        // Generate access token (expires in 1 hour)
        const accessToken = jwt.sign(
            { user_id: user.user_id, roles: user.roles },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Generate refresh token (expires in 7 days)
        const refreshToken = jwt.sign(
            { user_id: user.user_id },
            process.env.REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        console.log("🔑 Tokens generated successfully");

        // Save refresh token in DB
        user.refreshToken = refreshToken;
        await user.save();

        console.log("✅ Refresh token saved!");

        res.json({ accessToken, refreshToken });

    } catch (err) {
        console.error("❌ Error logging in:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token is required' });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

        // Find user by decoded user_id
        const user = await User.findOne({ user_id: decoded.user_id, refreshToken });
        if (!user) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        // Generate a new access token
        const newAccessToken = jwt.sign(
            { user_id: user.user_id, roles: user.roles },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ accessToken: newAccessToken });

    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired refresh token' });
    }
};

exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findOne({ user_id: req.user.user_id }).select("-password -refreshToken");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.logoutUser = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token is required for logout' });
        }

        // Find user with the provided refresh token and remove it
        const user = await User.findOneAndUpdate(
            { refreshToken },
            { refreshToken: null },
            { new: true }
        );

        if (!user) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        res.json({ message: 'Logged out successfully' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
