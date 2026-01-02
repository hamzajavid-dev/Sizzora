const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.Mixed, required: true }, // Accepts ObjectId or "guest_user" string
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true } // Snapshot of price at order time
    }],
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'],
        default: 'pending'
    },
    shippingAddress: { type: String, required: true },
    customerName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    paymentProofImage: { type: String }, // Path to uploaded image
    additionalDetails: { type: String },
    paymentMethod: { type: String, default: 'Cash on Delivery' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
