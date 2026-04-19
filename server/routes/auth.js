const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Chat = require('../models/Chat');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const { verifyAdmin } = auth; 

const { body, validationResult } = require('express-validator');

// Register
router.post('/register', [
    body('name').trim().notEmpty().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long').matches(/\d/).withMessage('Password must contain a number').matches(/[A-Z]/).withMessage('Password must contain an uppercase letter'),
    body('phone').optional().trim().escape()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('[REGISTER FAIL] Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, email, password, phone } = req.body;
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(12); // Stronger salt
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ name, email, password: hashedPassword, phone });
        await user.save();

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' }); // Short-lived access token
        const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET || 'refreshsecret', { expiresIn: '7d' }); // Secure refresh token

        // Set HttpOnly Cookie for Access Token
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 15 * 60 * 1000, // 15 minutes
            sameSite: 'lax' // Changed from strict to lax for better compatibility
        });

        // Set HttpOnly Cookie for Refresh Token
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            sameSite: 'lax',
            path: '/api/auth/refresh'
        });

        res.status(201).json({ user: { id: user._id, name: user.displayName || user.name, email, role: user.role, phone: user.phone } });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
router.post('/login', [
    body('identifier').exists().withMessage('Email or Username is required'), // Changed from 'email' to 'identifier'
    body('password').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { identifier, password } = req.body;

        // Helper to escape special characters for regex
        const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        const regex = new RegExp(`^${escapeRegex(identifier)}$`, 'i');

        // Find user by Email OR Name (Case Insensitive)
        const user = await User.findOne({
            $or: [
                { email: regex },
                { name: regex }
            ]
        });

        if (!user) {
            console.log(`[LOGIN FAIL] User not found for identifier: ${identifier}`);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`[LOGIN FAIL] Password mismatch for user: ${user.email}`);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' });
        const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET || 'refreshsecret', { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 15 * 60 * 1000, // 15 minutes
            sameSite: 'lax'
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            sameSite: 'lax',
            path: '/api/auth/refresh'
        });

        res.json({ user: { id: user._id, name: user.displayName || user.name, email: user.email, role: user.role, phone: user.phone } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0)
    });
    res.json({ message: 'Logged out successfully' });
});

// Get Current User (Persistence)
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Return user data in consistent format
        res.json({
            id: user._id,
            name: user.displayName || user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            address: user.address,
            createdAt: user.createdAt
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all users (Admin)
router.get('/users', verifyAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete user (Admin)
// Delete user (Admin)
router.delete('/users/:id', verifyAdmin, async (req, res) => {
    try {
        console.log(`[DELETE USER] Request received for ID: ${req.params.id}`);
        
        const deletedUser = await User.findByIdAndDelete(req.params.id);

        if (!deletedUser) {
            console.log(`[DELETE USER] User not found: ${req.params.id}`);
            return res.status(404).json({ message: 'User not found' });
        }

        // Auto-archive user's chats
        // Handle both String and ObjectId userId formats since Schema is Mixed
        const result = await Chat.updateMany(
            { 
                $or: [
                    { userId: req.params.id }, 
                    { userId: new mongoose.Types.ObjectId(req.params.id) }
                ] 
            },
            { $set: { isArchived: true, isActive: false } }
        );
        console.log(`[DELETE USER] Archived ${result.modifiedCount} chats for user ${req.params.id}`);

        console.log(`[DELETE USER] success: ${deletedUser.email}`);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('[DELETE USER] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Refresh Token
router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.status(401).json({ message: 'No refresh token provided' });

        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refreshsecret', async (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Invalid refresh token' });

            const user = await User.findById(decoded.userId);
            if (!user) return res.status(404).json({ message: 'User not found' });

            const token = jwt.sign({ userId: decoded.userId, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' });

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 15 * 60 * 1000, // 15 minutes
                sameSite: 'lax'
            });

            res.json({ message: 'Token refreshed' });
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
