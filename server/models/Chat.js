const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.Mixed, required: true }, // Can be ObjectId (User) or String (email/guest)
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },

    // Link to specific item
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    feedbackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Feedback' },
    chatType: { type: String, enum: ['order', 'complaint', 'suggestion', 'feedback', 'general'], required: true },
    chatTitle: { type: String, required: true }, // e.g., "Order #abc123", "Complaint about X"

    messages: [{
        sender: { type: String, enum: ['user', 'admin'], required: true },
        message: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        read: { type: Boolean, default: false }
    }],

    isBlocked: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }, // Order delivered/cancelled = inactive
    isArchived: { type: Boolean, default: false }, // Manually archived by admin
    lastMessageAt: { type: Date, default: Date.now },
    unreadAdminCount: { type: Number, default: 0 },
    unreadUserCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', chatSchema);
