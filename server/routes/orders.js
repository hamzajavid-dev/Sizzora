const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const ArchivedOrder = require('../models/ArchivedOrder');
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
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const jwt = require('jsonwebtoken');

// Create Order (with Image Upload)
router.post('/', upload.single('paymentProofImage'), async (req, res) => {
    try {
        const { items, totalAmount, shippingAddress, customerName, phoneNumber, additionalDetails } = req.body;

        // Parse items if it comes as string (FormData sends arrays as strings sometimes)
        let parsedItems = items;
        if (typeof items === 'string') {
            parsedItems = JSON.parse(items);
        }

        // Securely determine userId from HttpOnly Cookie
        let userId = 'guest';
        console.log('ORDER DEBUG: Cookie Token:', req.cookies.token ? 'Present' : 'Missing');

        if (req.cookies.token) {
            try {
                const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET || 'secret');
                userId = decoded.userId;
                console.log('ORDER DEBUG: Decoded UserID from Cookie:', userId);
            } catch (err) {
                console.log('ORDER DEBUG: Token verif failed:', err.message);
                // Fallback to guest if token is invalid
            }
        }

        console.log('ORDER DEBUG: Request Body UserID:', req.body.userId);
        console.log('ORDER DEBUG: Final UserID for Order:', userId);

        if (req.body.userId && req.body.userId !== 'guest_user' && userId === 'guest') {
            // Fallback to body userId ONLY if cookie is missing (for safety, though cookie is preferred)
            // Ideally we shouldn't trust body userId for auth, but we'll leave logic flexible for now
            // forcing cookie pref takes precedence.
            console.log('ORDER DEBUG: Warning - Cookie missing, checking body userId fallback (NOT IMPLEMENTED fully)');
        }

        const order = new Order({
            user: userId,
            items: parsedItems,
            totalAmount,
            shippingAddress,
            customerName,
            phoneNumber,
            additionalDetails,
            paymentProofImage: req.file ? `/uploads/${req.file.filename}` : null
        });

        await order.save();
        res.status(201).json(order);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Archive Order
router.post('/:id/archive', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const archivedOrder = new ArchivedOrder({
            originalOrderId: order._id,
            user: order.user,
            items: order.items,
            totalAmount: order.totalAmount,
            status: order.status,
            shippingAddress: order.shippingAddress,
            customerName: order.customerName,
            phoneNumber: order.phoneNumber,
            paymentProofImage: order.paymentProofImage,
            additionalDetails: order.additionalDetails,
            originalCreatedAt: order.createdAt
        });

        await archivedOrder.save();
        await Order.findByIdAndDelete(req.params.id);

        res.json({ message: 'Order archived successfully', archivedOrder });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Archived Orders
router.get('/archived', async (req, res) => {
    try {
        const archives = await ArchivedOrder.find().sort({ archivedAt: -1 });
        res.json(archives);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Archived Order (Permanently)
router.delete('/archived/:id', async (req, res) => {
    try {
        await ArchivedOrder.findByIdAndDelete(req.params.id);
        res.json({ message: 'Archived order deleted permanently' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get My Orders
router.get('/myorders/:userId', async (req, res) => {
    try {
        const orders = await Order.find({ user: req.params.userId }).populate('items.product');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get All Orders
router.get('/all', async (req, res) => {
    try {
        const orders = await Order.find().populate('user').populate('items.product');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Update Status
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(order);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
