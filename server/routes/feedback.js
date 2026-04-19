const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const Chat = require('../models/Chat');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const { verifyAdmin } = auth;

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'feedback-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Get all feedback (for admin)
router.get('/', verifyAdmin, async (req, res) => {
    try {
        const feedback = await Feedback.find().sort({ createdAt: -1 });
        res.json(feedback);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Submit new feedback (suggestion or complaint)
router.post('/', async (req, res) => {
    console.log('Received feedback submission:', req.body.type);
    try {
        const { type, name, email, phone, complaintType, message, image } = req.body;

        if (!type || !name || !email || !phone || !message) {
            console.log('Missing required fields');
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const feedback = new Feedback({
            type,
            name,
            email,
            phone,
            complaintType: type === 'complaint' ? complaintType : undefined,
            message,
            image
        });
        await feedback.save();
        console.log('Feedback saved successfully');
        
        // Automatically create chat for this feedback/complaint/suggestion
        try {
            // Try to get userId from cookie token
            let userId = null;
            let userName = name;
            let userEmail = email;
            
            if (req.cookies && req.cookies.token) {
                try {
                    const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET || 'secret');
                    userId = decoded.userId;
                    const user = await User.findById(userId);
                    if (user) {
                        userName = user.displayName || user.email;
                        userEmail = user.email;
                    }
                } catch (err) {
                    console.log('Token verification failed for feedback chat creation');
                }
            }
            
            // Only create chat if user is logged in
            if (userId) {
                const chatTitle = type === 'complaint' 
                    ? `Complaint: ${complaintType || 'General'}`
                    : type === 'suggestion'
                    ? `Suggestion from ${name}`
                    : `Feedback from ${name}`;
                
                const newChat = new Chat({
                    userId: userId,
                    userName: userName,
                    userEmail: userEmail,
                    feedbackId: feedback._id,
                    chatType: type, // 'complaint', 'suggestion', or 'feedback'
                    chatTitle: chatTitle,
                    isActive: true,
                    messages: []
                });
                await newChat.save();
                console.log('Chat created for feedback:', feedback._id);
            }
        } catch (chatErr) {
            console.error('Failed to create chat for feedback:', chatErr);
            // Don't fail the feedback submission if chat fails
        }
        
        res.status(201).json({ message: 'Feedback submitted successfully', feedback });
    } catch (err) {
        console.error('Error saving feedback:', err);
        res.status(400).json({ error: err.message });
    }
});

// Update feedback status (resolve/discard)
router.put('/:id', verifyAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const feedback = await Feedback.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        // If resolved, archive the associated chat
        if (status === 'resolved' && feedback) {
             const updatedChat = await Chat.findOneAndUpdate(
                 { feedbackId: feedback._id },
                 { isArchived: true, isActive: false },
                 { new: true }
             );
             if (updatedChat) {
                 console.log(`Chat archived for feedback ${feedback._id}`);
             }
        }

        res.json(feedback);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete feedback
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        await Feedback.findByIdAndDelete(req.params.id);
        res.json({ message: 'Feedback deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
