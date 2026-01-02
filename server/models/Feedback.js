const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['suggestion', 'complaint']
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    complaintType: { type: String }, // Only for complaints
    message: { type: String, required: true },
    image: { type: String }, // Base64 or URL
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'resolved', 'discarded']
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
