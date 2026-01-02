const mongoose = require('mongoose');

const archivedOrderSchema = new mongoose.Schema({
    originalOrderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    user: { type: mongoose.Schema.Types.Mixed, required: true },
    items: [{
        product: { type: mongoose.Schema.Types.Mixed }, // Store snapshot or ID
        quantity: { type: Number },
        price: { type: Number }
    }],
    totalAmount: { type: Number },
    status: { type: String },
    shippingAddress: { type: String },
    customerName: { type: String },
    phoneNumber: { type: String },
    paymentProofImage: { type: String },
    additionalDetails: { type: String },
    archivedAt: { type: Date, default: Date.now },
    originalCreatedAt: { type: Date }
});

module.exports = mongoose.model('ArchivedOrder', archivedOrderSchema);
