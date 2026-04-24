const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Order = require('../models/Order');
const Feedback = require('../models/Feedback');
const User = require('../models/User'); // Import User model
const auth = require('../middleware/auth');
const { verifyAdmin } = auth;

// Get all chats for a user
router.get('/user/:userId', auth, async (req, res) => {
    try {
         // Ensure user is requesting their own chats
         if (req.user.userId !== req.params.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        const chats = await Chat.find({ userId: req.params.userId }).sort({ lastMessageAt: -1 });
        res.json(chats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create chat for specific order/feedback
router.post('/create', async (req, res) => {
    try {
        const { userId, userName, userEmail, orderId, feedbackId, chatType, chatTitle } = req.body;

        // Check if chat already exists for this order/feedback
        let existingChat;
        if (orderId) {
            existingChat = await Chat.findOne({ orderId });
        } else if (feedbackId) {
            existingChat = await Chat.findOne({ feedbackId });
        }

        if (existingChat) {
            return res.json(existingChat);
        }

        const chat = new Chat({
            userId,
            userName,
            userEmail,
            orderId,
            feedbackId,
            chatType,
            chatTitle,
            messages: [],
            isActive: true
        });

        await chat.save();
        res.json(chat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all chats (Admin)
router.get('/all', verifyAdmin, async (req, res) => {
    try {
        // Fetch meaningful chats only, sorted by:
        // 1. Has Unread Admin Messages (High Priority)
        // 2. Is Active
        // 3. Most recent message
        
        const chats = await Chat.find()
            .sort({ unreadAdminCount: -1, isActive: -1, lastMessageAt: -1 });

        res.json(chats);
    } catch (err) {
        console.error('Error fetching chats:', err);
        res.status(500).json({ error: err.message });
    }
});

// Send message
router.post('/:chatId/message', async (req, res) => {
    try {
        const { sender, message } = req.body;
        const chat = await Chat.findById(req.params.chatId);

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        // Check if user is blocked
        if (chat.isBlocked && sender === 'user') {
            return res.status(403).json({ error: 'You are blocked from sending messages' });
        }

        chat.messages.push({
            sender,
            message,
            timestamp: new Date(),
            read: false
        });

        chat.lastMessageAt = new Date();

        // Update unread counts
        if (sender === 'user') {
            chat.unreadAdminCount += 1;
            // Un-archive and re-activate if user sends a message
            chat.isArchived = false;
            chat.isActive = true;
        } else {
            chat.unreadUserCount += 1;
        }

        await chat.save();
        
        // Emit Socket Event
        const io = req.app.get('socketio');
        if (io) {
            io.to(req.params.chatId).emit('receive_message', chat);
            // Also notify admin dashboard or user list if needed
        }

        res.json(chat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark messages as read
router.put('/:chatId/read', async (req, res) => {
    try {
        const { reader } = req.body; // 'admin' or 'user'
        const chat = await Chat.findById(req.params.chatId);

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        // Mark unread messages as read
        chat.messages.forEach(msg => {
            if (!msg.read && msg.sender !== reader) {
                msg.read = true;
            }
        });

        // Reset unread count
        if (reader === 'admin') {
            chat.unreadAdminCount = 0;
        } else {
            chat.unreadUserCount = 0;
        }

        await chat.save();
        res.json(chat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get unread count for admin
router.get('/unread/admin', verifyAdmin, async (req, res) => {
    try {
        const chats = await Chat.find({ unreadAdminCount: { $gt: 0 } });
        const totalUnread = chats.reduce((sum, chat) => sum + chat.unreadAdminCount, 0);
        res.json({ count: totalUnread, chats: chats.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a single message (user can delete own message, admin can delete any)
router.delete('/:chatId/message/:messageId', auth, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId);

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        const messageIndex = chat.messages.findIndex(m => m._id.toString() === req.params.messageId);

        if (messageIndex === -1) {
            return res.status(404).json({ error: 'Message not found' });
        }

        const message = chat.messages[messageIndex];

        // Authorization Check
        if (req.user.role !== 'admin') {
            // Regular user: Can only delete their own messages in their own chat
            if (chat.userId.toString() !== req.user.userId && chat.userId !== req.user.userId) {
                 return res.status(403).json({ error: 'Access denied to this chat' });
            }
            if (message.sender !== 'user') {
                return res.status(403).json({ error: 'You can only delete your own messages' });
            }
        }

        chat.messages.splice(messageIndex, 1);
        await chat.save();

        // Emit Socket Event for real-time update
        const io = req.app.get('socketio');
        if (io) {
            io.to(req.params.chatId).emit('receive_message', chat);
        }

        res.json(chat);
    } catch (err) {
        console.error('[DELETE MSG] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete entire chat history (Admin only)
router.delete('/:chatId/history', verifyAdmin, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId);

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        chat.messages = [];
        chat.unreadAdminCount = 0;
        chat.unreadUserCount = 0;
        await chat.save();
        
        // Emit Socket Event
        const io = req.app.get('socketio');
        if (io) {
            io.to(req.params.chatId).emit('receive_message', chat);
        }

        res.json({ message: 'Chat history deleted', chat });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Block/Unblock user (Admin only)
router.put('/:chatId/block', verifyAdmin, async (req, res) => {
    try {
        const { isBlocked } = req.body;
        const chat = await Chat.findById(req.params.chatId);

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        chat.isBlocked = isBlocked;
        await chat.save();
        res.json({ message: `User ${isBlocked ? 'blocked' : 'unblocked'}`, chat });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Archive/Unarchive chat (Admin only)
router.put('/:chatId/archive', verifyAdmin, async (req, res) => {
    try {
        const { isArchived } = req.body;
        const chat = await Chat.findById(req.params.chatId);

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        chat.isArchived = isArchived;
        await chat.save();
        res.json(chat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete chat permanently (Admin only)
router.delete('/:chatId', verifyAdmin, async (req, res) => {
    try {
        const chat = await Chat.findByIdAndDelete(req.params.chatId);

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        res.json({ message: 'Chat deleted successfully' });
    } catch (err) {
        // Handle invalid ID format as Not Found
        if (err.name === 'CastError') {
             return res.status(404).json({ error: 'Chat not found' });
        }
        res.status(500).json({ error: err.message });
    }
});

// AI chatbot proxy — forwards to n8n to avoid browser CORS restrictions
router.post('/ai', async (req, res) => {
    const N8N_WEBHOOK = process.env.N8N_CHATBOT_WEBHOOK || 'https://n8n-ztpf.onrender.com/webhook/3aab88c3-0b5c-4a7a-ae1d-7af31352e599';
    try {
        const https = require('https');
        const url = new URL(N8N_WEBHOOK);

        // Append payload as query params (n8n webhook configured for GET)
        const params = new URLSearchParams({
            message: req.body.message || '',
            sessionId: req.body.sessionId || '',
            userName: req.body.userName || '',
            userPhone: req.body.userPhone || '',
            userAddress: req.body.userAddress || '',
            userId: req.body.userId || '',
            imageUrl: req.body.imageUrl || '',
        });
        url.search = params.toString();

        const data = await new Promise((resolve, reject) => {
            const options = {
                hostname: url.hostname,
                path: url.pathname + url.search,
                method: 'GET',
            };
            const request = https.request(options, (response) => {
                let raw = '';
                response.on('data', chunk => raw += chunk);
                response.on('end', () => {
                    try { resolve(JSON.parse(raw)); } catch { resolve(raw); }
                });
            });
            request.on('error', reject);
            request.end();
        });

        res.json(data);
    } catch (err) {
        res.status(502).json({ error: 'AI service unavailable', details: err.message });
    }
});

module.exports = router;
