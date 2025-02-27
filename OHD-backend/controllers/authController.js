const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/emailService');

exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, roles } = req.body;

        // Check if email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already registered' });
        }

        // Prevent users from registering as Admin
        if (roles && roles.includes('Admin')) {
            return res.status(403).json({ message: 'You cannot register as an Admin' });
        }

        // Generate a unique user_id (Auto-increment logic)
        const lastUser = await User.findOne().sort({ user_id: -1 });
        const newUserId = lastUser
            ? `U${(parseInt(lastUser.user_id.substring(1)) + 1).toString().padStart(6, '0')}` 
            : 'U000001';

        // Create new user
        const newUser = new User({
            user_id: newUserId,
            name,
            email,
            password,
            roles: roles || ['Requester'], // Default role: 'Requester'
        });

        await newUser.save();

        // Generate JWT Token
        const token = jwt.sign(
            { user_id: newUser.user_id, roles: newUser.roles },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        // **Send response first to prevent delay or errors from email sending**
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { user_id: newUser.user_id, name: newUser.name, email: newUser.email, roles: newUser.roles }
        });

        // **Send email after response (Handle errors separately)**
        try {
            await sendEmail(
                email,
                "Registered to Online Help Desk",
                `Registered`,
                `
                <p>You have successfully registered to Online Help Desk as a Requester</p>
                <p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p>
                <p>Thank you for registering to Online Help Desk.</p>
                `
            );
        } catch (emailError) {
            console.error("Email sending failed:", emailError.message);
        }

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

        console.log(user)

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
