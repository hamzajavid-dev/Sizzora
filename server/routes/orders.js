const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const ArchivedOrder = require('../models/ArchivedOrder');
const Chat = require('../models/Chat');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Use absolute path so uploads are always in server/uploads/ regardless of CWD
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(UPLOADS_DIR)) {
            fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        }
        cb(null, UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const { verifyAdmin } = auth;

// Chatbot image upload — open to all (guests included); payment proof doesn't require a user account
router.post('/chatbot-upload', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
    }
    // Return absolute URL so n8n / MCP server can fetch the image
    const baseUrl = process.env.BACKEND_URL ||
        `${req.protocol}://${req.get('host')}`;
    res.json({ imageUrl: `${baseUrl}/uploads/${req.file.filename}` });
});

// Chatbot order creation (server-to-server, secured with shared secret)
router.post('/chatbot', async (req, res) => {
    const secret = req.headers['x-chatbot-secret'];
    if (!secret || secret !== process.env.CHATBOT_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const { userId, items, totalAmount, shippingAddress, customerName, phoneNumber, imageUrl } = req.body;
        if (!items || !items.length || !totalAmount || !shippingAddress || !customerName || !phoneNumber) {
            return res.status(400).json({ error: 'Missing required order fields' });
        }
        if (!imageUrl) {
            return res.status(400).json({ error: 'Payment proof image is required. Please ask the customer to upload a screenshot of their payment before placing the order.' });
        }
        const order = new Order({
            user: userId || 'guest',
            items,
            totalAmount,
            shippingAddress,
            customerName,
            phoneNumber,
            paymentMethod: 'Payment Proof',
            paymentProofImage: imageUrl || null,
            status: 'pending'
        });
        await order.save();

        // Create a chat for the order if userId is a real user
        if (userId && userId !== 'guest') {
            try {
                const user = await User.findById(userId);
                if (user) {
                    const newChat = new Chat({
                        userId,
                        userName: user.displayName || customerName,
                        userEmail: user.email,
                        orderId: order._id,
                        chatType: 'order',
                        chatTitle: `Order #${order._id.toString().slice(-6)}`,
                        isActive: true,
                        messages: []
                    });
                    await newChat.save();
                }
            } catch (chatErr) {
                console.error('Failed to create chat for chatbot order:', chatErr);
            }
        }

        res.status(201).json({ orderId: order._id, totalAmount: order.totalAmount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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
        
        // Automatically create chat for this order if user is not guest
        if (userId !== 'guest') {
            try {
                const user = await User.findById(userId);
                if (user) {
                    const newChat = new Chat({
                        userId: userId,
                        userName: user.displayName || user.email,
                        userEmail: user.email,
                        orderId: order._id,
                        chatType: 'order',
                        chatTitle: `Order #${order._id.toString().slice(-6)}`,
                        isActive: true,
                        messages: []
                    });
                    await newChat.save();
                    console.log('Chat created for order:', order._id);
                }
            } catch (chatErr) {
                console.error('Failed to create chat for order:', chatErr);
                // Don't fail the order creation if chat fails
            }
        }
        
        res.status(201).json(order);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Archive Order
router.post('/:id/archive', verifyAdmin, async (req, res) => {
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
router.get('/archived', verifyAdmin, async (req, res) => {
    try {
        const archives = await ArchivedOrder.find().sort({ archivedAt: -1 });
        res.json(archives);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Archived Order (Permanently)
router.delete('/archived/:id', verifyAdmin, async (req, res) => {
    try {
        const archivedOrder = await ArchivedOrder.findById(req.params.id);
        
        if (!archivedOrder) {
            return res.status(404).json({ error: 'Archived order not found' });
        }

        // Delete payment proof image if it exists
        if (archivedOrder.paymentProofImage) {
            const imagePath = path.join(__dirname, '..', archivedOrder.paymentProofImage);
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error('Failed to delete image:', err);
                } else {
                    console.log('Payment proof image deleted:', imagePath);
                }
            });
        }

        await ArchivedOrder.findByIdAndDelete(req.params.id);
        res.json({ message: 'Archived order and associated files deleted permanently' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get My Orders
router.get('/myorders/:userId', auth, async (req, res) => {
    try {
        // Ensure user is requesting their own orders
        if (req.user.userId !== req.params.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        const orders = await Order.find({ user: req.params.userId }).populate('items.product');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get All Orders
router.get('/all', verifyAdmin, async (req, res) => {
    try {
        const orders = await Order.find().populate('user').populate('items.product');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Update Status
router.put('/:id/status', verifyAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        
        // Update chat isActive/isArchived status if order is delivered or cancelled
        if (status === 'delivered' || status === 'cancelled') {
            await Chat.findOneAndUpdate(
                { orderId: req.params.id },
                { isActive: false, isArchived: true }
            );
        } else {
            // Reactivate if status changes back
            await Chat.findOneAndUpdate(
                { orderId: req.params.id },
                { isActive: true, isArchived: false }
            );
        }
        
        res.json(order);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete Active Order (Permanently) - Admin only
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Delete payment proof image if it exists
        if (order.paymentProofImage) {
            const imagePath = path.join(__dirname, '..', order.paymentProofImage);
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error('Failed to delete image:', err);
                } else {
                    console.log('Payment proof image deleted:', imagePath);
                }
            });
        }

        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: 'Order and associated files deleted permanently' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
