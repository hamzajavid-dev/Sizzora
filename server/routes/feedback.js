const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
router.get('/', async (req, res) => {
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
        res.status(201).json({ message: 'Feedback submitted successfully', feedback });
    } catch (err) {
        console.error('Error saving feedback:', err);
        res.status(400).json({ error: err.message });
    }
});

// Update feedback status (resolve/discard)
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const feedback = await Feedback.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json(feedback);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete feedback
router.delete('/:id', async (req, res) => {
    try {
        await Feedback.findByIdAndDelete(req.params.id);
        res.json({ message: 'Feedback deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
