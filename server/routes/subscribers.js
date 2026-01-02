const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');

// POST /api/subscribers - Add a new subscriber
router.post('/', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Check if already exists
        const existing = await Subscriber.findOne({ email });
        if (existing) {
            return res.status(200).json({ message: 'You are already subscribed!' });
        }

        const newSubscriber = new Subscriber({ email });
        await newSubscriber.save();

        res.status(201).json({ message: 'Successfully subscribed to our newsletter!' });
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
